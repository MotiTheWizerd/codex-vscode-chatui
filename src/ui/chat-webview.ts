// ui/chat-webview.ts
import * as vscode from "vscode";
import { CoreManager } from "@/core/manager";
import { Logger } from "@/telemetry/logger.js";

export class ChatWebview implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private disposed = false;
  private logger: Logger | null = null;

  private constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly core: CoreManager,
    private readonly onDispose?: () => void
  ) {
    // create the panel
    this.panel = vscode.window.createWebviewPanel(
      "codex.chat",
      "Codex Chat",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")],
      }
    );

    // listen + cleanup
    const recv = this.panel.webview.onDidReceiveMessage((msg) => {
      this.logger?.info("from webview", msg);
    });
    const cleanup = this.panel.onDidDispose(() => this.dispose());

    this.disposables.push(recv, cleanup);

    // initial HTML
    void this.setHtml(context);

    // optional: watch for changes in media/chat and auto-refresh
    const assetPattern = new vscode.RelativePattern(
      vscode.Uri.joinPath(context.extensionUri, "media", "chat"),
      "**/*.{css,js}"
    );
    const htmlPattern = new vscode.RelativePattern(
      vscode.Uri.joinPath(context.extensionUri, "media", "chat", "html"),
      "**/*.html"
    );
    const watcherAssets = vscode.workspace.createFileSystemWatcher(assetPattern);
    const watcherHtml = vscode.workspace.createFileSystemWatcher(htmlPattern);
    let refreshTimer: NodeJS.Timeout | undefined;
    const refresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void this.setHtml(context), 150);
    };
    watcherAssets.onDidCreate(refresh);
    watcherAssets.onDidChange(refresh);
    watcherAssets.onDidDelete(refresh);
    watcherHtml.onDidCreate(refresh);
    watcherHtml.onDidChange(refresh);
    watcherHtml.onDidDelete(refresh);
    this.disposables.push(
      watcherAssets,
      watcherHtml,
      { dispose: () => refreshTimer && clearTimeout(refreshTimer) }
    );
  }

  private panel: vscode.WebviewPanel;

  /** ✅ static factory, correct placement */
  static create(
    context: vscode.ExtensionContext,
    core: CoreManager,
    logger: Logger | null = null,
    onDispose?: () => void
  ): ChatWebview {
    const instance = new ChatWebview(context, core, onDispose);
    instance.logger = logger;
    return instance;
  }

  reveal(column: vscode.ViewColumn = vscode.ViewColumn.Beside) {
    this.panel.reveal(column);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    try {
      this.onDispose?.();
    } catch {}
    this.panel.dispose();
  }

  get webviewPanel(): vscode.WebviewPanel {
    return this.panel;
  }

  private async setHtml(context: vscode.ExtensionContext) {
    const webview = this.panel.webview;
    const nonce = getNonce();

    const chatDir = vscode.Uri.joinPath(context.extensionUri, "media", "chat");
    try {
      const entries = await vscode.workspace.fs.readDirectory(chatDir);

      const rootCss = entries
        .filter(([n, t]) => t === vscode.FileType.File && n.endsWith(".css"))
        .map(([n]) => vscode.Uri.joinPath(chatDir, n));
      const rootJs = entries
        .filter(([n, t]) => t === vscode.FileType.File && n.endsWith(".js"))
        .map(([n]) => vscode.Uri.joinPath(chatDir, n));

      // Optional subfolders: styles/ and js/
      const stylesDir = vscode.Uri.joinPath(chatDir, "styles");
      const jsDir = vscode.Uri.joinPath(chatDir, "js");
      const cssUris: vscode.Uri[] = [...rootCss];
      const jsUris: vscode.Uri[] = [...rootJs];
      try {
        const stylesEntries = await vscode.workspace.fs.readDirectory(stylesDir);
        for (const [n, t] of stylesEntries) {
          if (t === vscode.FileType.File && n.endsWith(".css")) {
            cssUris.push(vscode.Uri.joinPath(stylesDir, n));
          }
        }
      } catch {}
      try {
        const jsEntries = await vscode.workspace.fs.readDirectory(jsDir);
        for (const [n, t] of jsEntries) {
          if (t === vscode.FileType.File && n.endsWith(".js")) {
            jsUris.push(vscode.Uri.joinPath(jsDir, n));
          }
        }
      } catch {}

      // sort alphabetically by path
      cssUris.sort((a, b) => a.path.localeCompare(b.path));
      jsUris.sort((a, b) => a.path.localeCompare(b.path));

      const toUriWithV = async (u: vscode.Uri) => {
        const stat = await vscode.workspace.fs.stat(u);
        const wuri = webview.asWebviewUri(u);
        return `${String(wuri)}?v=${stat.mtime}`;
      };

      const styleTags = (await Promise.all(cssUris.map(toUriWithV)))
        .map((href) => `<link rel="stylesheet" href="${href}">`)
        .join("\n");

      const scriptTags = (await Promise.all(jsUris.map(toUriWithV)))
        .map((src) => `<script nonce="${nonce}" src="${src}"></script>`) // CSP nonce
        .join("\n");

      // load HTML template and inject
      const indexUri = vscode.Uri.joinPath(chatDir, "index.html");
      const bytes = await vscode.workspace.fs.readFile(indexUri);
      let html = Buffer.from(bytes).toString("utf8");
      // inject CSP vars + asset tags + HTML fragments
      const headDir = vscode.Uri.joinPath(chatDir, "html", "head");
      const bodyDir = vscode.Uri.joinPath(chatDir, "html", "body");
      const headParts = await readFragments(headDir, this.logger);
      const bodyParts = await readFragments(bodyDir, this.logger);
      const bodyWithBanner = (bodyParts.warnings.length
        ? '<div class="codex-fragment-warning" role="alert">Some fragments were skipped. See logs.</div>\n'
        : "") + bodyParts.html;

      html = html
        .replace(/{{CSP_SOURCE}}/g, webview.cspSource)
        .replace(/{{NONCE}}/g, nonce)
        .replace("{{STYLES}}", styleTags)
        .replace("{{SCRIPTS}}", scriptTags)
        .replace("{{HEAD_PARTS}}", headParts.html)
        .replace("{{BODY_PARTS}}", bodyWithBanner);

      webview.html = html;
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      this.logger?.error?.("Failed to set chat HTML", { error: m });
      // minimal fallback content to show error
      webview.html = `<!DOCTYPE html><html><body><pre>Failed to load chat UI: ${escapeHtml(
        m
      )}</pre></body></html>`;
    }
  }
}

function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ----- HTML fragment helpers -----
interface FragmentResult {
  html: string;
  injected: string[];
  warnings: string[];
}

async function collectHtmlFiles(root: vscode.Uri): Promise<vscode.Uri[]> {
  const files: vscode.Uri[] = [];
  const stack: vscode.Uri[] = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    try {
      const entries = await vscode.workspace.fs.readDirectory(dir);
      for (const [name, type] of entries) {
        const u = vscode.Uri.joinPath(dir, name);
        if (type === vscode.FileType.File && name.toLowerCase().endsWith(".html")) {
          files.push(u);
        } else if (type === vscode.FileType.Directory) {
          stack.push(u);
        }
      }
    } catch {
      // ignore; dir might not exist
    }
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

function hasForbiddenTags(html: string): string | null {
  const reScript = /<\s*script\b/i;
  const reCspMeta = /<\s*meta[^>]*http-equiv\s*=\s*["']content-security-policy["']/i;
  if (reScript.test(html)) return "Contains <script> tag";
  if (reCspMeta.test(html)) return "Contains CSP <meta http-equiv> tag";
  return null;
}

function htmlCommentSeparator(label: string): string {
  return `<!-- ----- fragment separator: ${label} ----- -->`;
}

async function readFragments(dir: vscode.Uri, logger?: Logger | null): Promise<FragmentResult> {
  const result: FragmentResult = { html: "", injected: [], warnings: [] };
  const files = await collectHtmlFiles(dir);
  if (!files.length) return result;
  const parts: string[] = [];
  for (const file of files) {
    try {
      const text = Buffer.from(await vscode.workspace.fs.readFile(file)).toString("utf8");
      const forbidden = hasForbiddenTags(text);
      const label = file.path;
      if (forbidden) {
        logger?.warn?.("fragment rejected", { file: label, reason: forbidden });
        result.warnings.push(`${label}: ${forbidden}`);
        continue;
      }
      parts.push(`${htmlCommentSeparator(label)}\n${text.trim()}`);
      result.injected.push(label);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      logger?.warn?.("fragment read error", { file: file.path, error: m });
      result.warnings.push(`${file.path}: ${m}`);
    }
  }
  if (result.injected.length) {
    logger?.info?.("fragments injected", { dir: dir.path, count: result.injected.length });
  }
  result.html = parts.join("\n");
  return result;
}
