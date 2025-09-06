// ui/chat-webview.ts
import * as vscode from "vscode";
import { CoreManager } from "@/core/manager";
import type { Logger } from "@/telemetry/logger.js";
import { Events } from "@core/events";

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
      "codexq.chat",
      "Codex Q Chat",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "media"),
          vscode.Uri.joinPath(context.extensionUri, "dist"),
        ],
      }
    );

    // listen + cleanup
    const recv = this.panel.webview.onDidReceiveMessage(async (msg) => {
      try {
        if (!msg || typeof msg !== "object") return;
        const type = msg.type as string | undefined;
        this.logger?.info("from webview", msg);

        // Handshake: UI announced readiness → send init payload
        if (type === "ui.ready") {
          const di = this.core.diContainer;
          const sessionStore = di.has("sessionStore")
            ? di.resolve<import("@/state/session-store").SessionStore>(
                "sessionStore"
              )
            : null;
          const config = this.core.config.getAll();
          const features = this.core.config.getFeatures();

          const session = sessionStore?.getCurrentSession() ?? null;
          const uiMessages = session
            ? session.messages.map((m) => ({
                id: m.id,
                role: m.role === "system" ? ("assistant" as const) : m.role, // UI expects 'user' | 'assistant'
                text: m.content,
              }))
            : [];

          this.panel.webview.postMessage({
            type: "init",
            payload: {
              schemaVersion: 1,
              session: { id: session?.id ?? null, messages: uiMessages },
              features,
              config: {
                model: config.codex.model,
                streaming: config.features.streaming,
              },
            },
          });
          return;
        }

        // User sent a message from UI → persist; transport may start separately
        if (type === "chat.userMessage") {
          const text: string | undefined = msg?.payload?.text ?? msg?.text;
          const attachments: unknown[] | undefined =
            msg?.payload?.attachments ?? msg?.attachments;
          const embeddedFiles: string[] | undefined =
            msg?.payload?.embeddedFiles ?? msg?.embeddedFiles;
          const hasText = !!(text && text.trim());
          const hasAttachments =
            Array.isArray(attachments) && attachments.length > 0;
          const hasEmbedded =
            Array.isArray(embeddedFiles) && embeddedFiles.length > 0;
          if (!hasText && !hasAttachments && !hasEmbedded) return;
          // Forward to EventBus; CoreManager handles policies, persistence, and transport
          const streaming = this.core.config.getFeatures().streaming;
          const options: Record<string, unknown> = {};
          if (hasAttachments) options["attachments"] = attachments;
          if (hasEmbedded) options["embeddedFiles"] = embeddedFiles;
          this.core.eventBusInstance.publish(Events.UiSend, {
            text: text ?? "",
            streaming,
            options: Object.keys(options).length ? options : undefined,
          });
          return;
        }

        // Files bridge: index/search/listChildren/stat
        if (
          type === "files/index" ||
          type === "files/search" ||
          type === "files/listChildren" ||
          type === "files/stat" ||
          type === "files/resolveDrop"
        ) {
          const reqId: string | undefined = msg?.payload?.reqId ?? msg?.reqId;
          const limit: number | undefined = msg?.payload?.limit ?? msg?.limit;
          const q: string | undefined = msg?.payload?.q ?? msg?.q;
          const path: string | undefined = msg?.payload?.path ?? msg?.path;
          const dropped: string[] | undefined =
            msg?.payload?.items ?? msg?.items;
          const files = this.core.filesService;
          const t0 = Date.now();
          if (!files) {
            this.panel.webview.postMessage({
              type: "files/result",
              op: "search",
              items: [],
              cursor: null,
              meta: {
                indexed: 0,
                complete: false,
                took_ms: Date.now() - t0,
                warnings: ["FilesService not available"],
              },
              reqId,
            });
            return;
          }
          try {
            if (type === "files/index") {
              const items = files.indexSlice(
                Math.max(1, Math.min(500, limit ?? 200))
              );
              const sum = files.summary();
              this.panel.webview.postMessage({
                type: "files/result",
                op: "index",
                items,
                cursor: null,
                meta: {
                  indexed: sum.indexed,
                  complete: sum.complete,
                  took_ms: Date.now() - t0,
                  warnings: [],
                },
                reqId,
              });
            } else if (type === "files/search") {
              const items = files.search(
                q ?? "",
                Math.max(1, Math.min(200, limit ?? 50))
              );
              const sum = files.summary();
              this.panel.webview.postMessage({
                type: "files/result",
                op: "search",
                items,
                cursor: null,
                meta: {
                  indexed: sum.indexed,
                  complete: sum.complete,
                  took_ms: Date.now() - t0,
                  warnings: [],
                },
                reqId,
              });
            } else if (type === "files/listChildren") {
              const items = files.listChildren(
                path ?? "",
                Math.max(1, Math.min(500, limit ?? 200))
              );
              const sum = files.summary();
              this.panel.webview.postMessage({
                type: "files/result",
                op: "listChildren",
                items,
                cursor: null,
                meta: {
                  indexed: sum.indexed,
                  complete: sum.complete,
                  took_ms: Date.now() - t0,
                  warnings: [],
                },
                reqId,
              });
            } else if (type === "files/stat") {
              const item = await files.stat(path ?? "");
              const sum = files.summary();
              const items = item ? [item] : [];
              this.panel.webview.postMessage({
                type: "files/result",
                op: "stat",
                items,
                cursor: null,
                meta: {
                  indexed: sum.indexed,
                  complete: sum.complete,
                  took_ms: Date.now() - t0,
                  warnings: [],
                },
                reqId,
              });
            } else if (type === "files/resolveDrop") {
              const res = await files.resolveDrop(
                Array.isArray(dropped) ? dropped : [],
                Math.max(1, Math.min(200, limit ?? 200))
              );
              const sum = files.summary();
              const warnings: string[] = [];
              if (res.bad.length)
                warnings.push(`${res.bad.length} items rejected`);
              if (res.truncated) warnings.push("truncated");
              this.panel.webview.postMessage({
                type: "files/result",
                op: "resolveDrop",
                items: res.items,
                cursor: null,
                meta: {
                  indexed: sum.indexed,
                  complete: sum.complete,
                  took_ms: Date.now() - t0,
                  warnings,
                },
                reqId,
              });
            }
          } catch (e) {
            const sum = files.summary();
            const err = e instanceof Error ? e.message : String(e);
            this.panel.webview.postMessage({
              type: "files/result",
              op: "search",
              items: [],
              cursor: null,
              meta: {
                indexed: sum.indexed,
                complete: sum.complete,
                took_ms: Date.now() - t0,
                warnings: [err],
              },
              reqId,
            });
          }
          return;
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        this.logger?.error?.("webview message handling error", { error: m });
      }
    });
    const cleanup = this.panel.onDidDispose(() => this.dispose());

    this.disposables.push(recv, cleanup);

    // Subscribe to transport events to forward updates to the webview
    const onToken = (payload: import("@core/events").TransportTokenPayload) => {
      try {
        this.panel.webview.postMessage({
          type: "assistant.token",
          token: payload.token,
        });
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        this.logger?.warn?.("post assistant.token failed", { error: m });
      }
    };
    const onComplete = async (
      _payload: import("@core/events").TransportCompletePayload
    ) => {
      try {
        // Look up the last assistant message and post commit
        const di = this.core.diContainer;
        if (di.has("sessionStore")) {
          const store =
            di.resolve<import("@/state/session-store").SessionStore>(
              "sessionStore"
            );
          const session = store.getCurrentSession();
          const last = session?.messages
            .slice()
            .reverse()
            .find((m) => m.role === "assistant");
          const text = last?.content ?? "";
          if (text)
            this.panel.webview.postMessage({ type: "assistant.commit", text });
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        this.logger?.warn?.("assistant.commit post failed", { error: m });
      }
    };
    const onError = (payload: import("@core/events").TransportErrorPayload) => {
      this.logger?.error?.("transport error", { error: payload.error });
      // Optional: surface an error banner via webview in future
    };
    const bus = this.core.eventBusInstance;
    bus.subscribe(Events.TransportToken, onToken as any);
    bus.subscribe(Events.TransportComplete, onComplete as any);
    bus.subscribe(Events.TransportError, onError as any);
    this.disposables.push(
      new vscode.Disposable(() => {
        bus.unsubscribe(Events.TransportToken, onToken as any);
        bus.unsubscribe(Events.TransportComplete, onComplete as any);
        bus.unsubscribe(Events.TransportError, onError as any);
      })
    );

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
    const watcherAssets =
      vscode.workspace.createFileSystemWatcher(assetPattern);
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
    this.disposables.push(watcherAssets, watcherHtml, {
      dispose: () => refreshTimer && clearTimeout(refreshTimer),
    });
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
        const stylesEntries = await vscode.workspace.fs.readDirectory(
          stylesDir
        );
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
      const distRegistry = vscode.Uri.joinPath(
        distUiDir,
        "elements-registry.js"
      );
      const distControllers = vscode.Uri.joinPath(distUiDir, "controllers.js");
      const distRenderer = vscode.Uri.joinPath(distUiDir, "renderer.js");
      const distBootstrap = vscode.Uri.joinPath(distUiDir, "bootstrap.js");
      const distComposerBootstrap = vscode.Uri.joinPath(
        distUiDir,
        "composer-bootstrap.js"
      );
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

      const distScriptTags = (await Promise.all(distScripts.map(toUriWithV)))
        .map(
          (src) =>
            `<script type="module" nonce="${nonce}" src="${src}"></script>`
        )
        .join("\n");
      const classicScriptTags = (await Promise.all(jsUris.map(toUriWithV)))
        .map((src) => `<script nonce="${nonce}" src="${src}"></script>`) // classic scripts
        .join("\n");
      const scriptTags = `${distScriptTags}\n${classicScriptTags}`;

      // load HTML template and inject
      const indexUri = vscode.Uri.joinPath(chatDir, "index.html");
      const bytes = await vscode.workspace.fs.readFile(indexUri);
      let html = Buffer.from(bytes).toString("utf8");
      // inject CSP vars + asset tags + HTML fragments
      const headDir = vscode.Uri.joinPath(chatDir, "html", "head");
      const headerDir = vscode.Uri.joinPath(chatDir, "html", "header");
      const messageDir = vscode.Uri.joinPath(chatDir, "html", "messages");
      const footerDir = vscode.Uri.joinPath(chatDir, "html", "footer");
      const headParts = await readFragments(headDir, this.logger);
      const headerParts = await readFragments(headerDir, this.logger);
      const messageParts = await readFragments(messageDir, this.logger);
      const footerParts = await readFragments(footerDir, this.logger);
      const messageWithBanner =
        (messageParts.warnings.length
          ? '<div class="codex-fragment-warning" role="alert">Some fragments were skipped. See logs.</div>\n'
          : "") + messageParts.html;
      const footerWithBanner =
        (footerParts.warnings.length
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
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
        if (
          type === vscode.FileType.File &&
          name.toLowerCase().endsWith(".html")
        ) {
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
  const reCspMeta =
    /<\s*meta[^>]*http-equiv\s*=\s*["']content-security-policy["']/i;
  if (reScript.test(html)) return "Contains <script> tag";
  if (reCspMeta.test(html)) return "Contains CSP <meta http-equiv> tag";
  return null;
}

function htmlCommentSeparator(label: string): string {
  return `<!-- ----- fragment separator: ${label} ----- -->`;
}

async function readFragments(
  dir: vscode.Uri,
  logger?: Logger | null
): Promise<FragmentResult> {
  const result: FragmentResult = { html: "", injected: [], warnings: [] };
  const files = await collectHtmlFiles(dir);
  if (!files.length) return result;
  const parts: string[] = [];
  for (const file of files) {
    try {
      const text = Buffer.from(
        await vscode.workspace.fs.readFile(file)
      ).toString("utf8");
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
    logger?.info?.("fragments injected", {
      dir: dir.path,
      count: result.injected.length,
    });
  }
  result.html = parts.join("\n");
  return result;
}
