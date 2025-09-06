import * as vscode from "vscode";
import type { Logger } from "@/telemetry/logger";

export async function getChatHtml(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  logger?: Logger | null
): Promise<string> {
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

    // Optionally inject compiled UI scripts first if present (classic scripts attaching globals)
    const distUiDir = vscode.Uri.joinPath(context.extensionUri, "dist", "ui");
    const distBridge = vscode.Uri.joinPath(distUiDir, "bridge.js");
    const distRegistry = vscode.Uri.joinPath(distUiDir, "elements-registry.js");
    const distControllers = vscode.Uri.joinPath(distUiDir, "controllers.js");
    const distRenderer = vscode.Uri.joinPath(distUiDir, "renderer.js");
    const distBootstrap = vscode.Uri.joinPath(distUiDir, "bootstrap.js");
    const distComposerBootstrap = vscode.Uri.joinPath(distUiDir, "composer-bootstrap.js");
    const distScripts: vscode.Uri[] = [];
    try {
      await vscode.workspace.fs.stat(distBridge);
      distScripts.push(distBridge);
    } catch {}
    try {
      await vscode.workspace.fs.stat(distRegistry);
      distScripts.push(distRegistry);
    } catch {}
    try {
      await vscode.workspace.fs.stat(distControllers);
      distScripts.push(distControllers);
    } catch {}
    try {
      await vscode.workspace.fs.stat(distRenderer);
      distScripts.push(distRenderer);
    } catch {}
    try {
      await vscode.workspace.fs.stat(distBootstrap);
      distScripts.push(distBootstrap);
    } catch {}
    try {
      await vscode.workspace.fs.stat(distComposerBootstrap);
      distScripts.push(distComposerBootstrap);
    } catch {}

    // Composer is initialized via composer-bootstrap.js which imports its own module graph.
    // No need to inject individual module files here.

    const distResolved = await Promise.all(distScripts.map(toUriWithV));
    logger?.info?.("chat-html: scripts", {
      dist: distResolved.length,
      classic: jsUris.length,
      styles: cssUris.length,
    });
    const distScriptTags = distResolved
      .map((src) => `<script type="module" nonce="${nonce}" src="${src}"></script>`)
      .join("\n");
    const classicScriptTags = (await Promise.all(jsUris.map(toUriWithV)))
      .map((src) => `<script nonce="${nonce}" src="${src}"></script>`) // classic scripts
      .join("\n");
    const scriptTags = `${distScriptTags}\n${classicScriptTags}`;

    // load HTML template and inject
    const indexUri = vscode.Uri.joinPath(chatDir, "index.html");
    const bytes = await vscode.workspace.fs.readFile(indexUri);
    let html = Buffer.from(bytes).toString("utf8");
    // Ensure CSP allows loading external scripts/styles from this webview
    html = html
      .replace(
        "script-src 'nonce-{{NONCE}}';",
        "script-src {{CSP_SOURCE}} 'nonce-{{NONCE}}';"
      )
      .replace(
        /style-src\s+\{\{CSP_SOURCE\}\};/,
        "style-src {{CSP_SOURCE}} 'unsafe-inline';"
      );
    // inject CSP vars + asset tags + HTML fragments
    const headDir = vscode.Uri.joinPath(chatDir, "html", "head");
    const headerDir = vscode.Uri.joinPath(chatDir, "html", "header");
    const messageDir = vscode.Uri.joinPath(chatDir, "html", "messages");
    const footerDir = vscode.Uri.joinPath(chatDir, "html", "footer");
    const headParts = await readFragments(headDir, logger);
    const headerParts = await readFragments(headerDir, logger);
    const messageParts = await readFragments(messageDir, logger);
    const footerParts = await readFragments(footerDir, logger);
    const messageWithBanner = (messageParts.warnings.length
      ? '<div class="codex-fragment-warning" role="alert">Some fragments were skipped. See logs.</div>\n'
      : "") + messageParts.html;
    const footerWithBanner = (footerParts.warnings.length
      ? '<div class="codex-fragment-warning" role="alert">Some fragments were skipped. See logs.</div>\n'
      : "") + footerParts.html;

    html = html
      .replace(/{{CSP_SOURCE}}/g, webview.cspSource)
      .replace(/{{NONCE}}/g, nonce)
      .replace("{{STYLES}}", styleTags)
      .replace("{{SCRIPTS}}", scriptTags)
      .replace("{{HEAD_PARTS}}", headParts.html)
      .replace("{{HEADER_PARTS}}", headerParts.html)
      .replace("{{MESSAGE_PARTS}}", messageWithBanner)
      .replace("{{FOOTER_PARTS}}", footerWithBanner);

    return html;
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    logger?.error?.("Failed to set chat HTML", { error: m });
    // minimal fallback content to show error
    return `<!DOCTYPE html><html><body><pre>Failed to load chat UI: ${escapeHtml(m)}</pre></body></html>`;
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
