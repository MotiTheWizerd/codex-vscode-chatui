import * as vscode from "vscode";
import { CoreManager } from "@/core/manager";
import { Events } from "@/core/events";
import type { Logger } from "@/telemetry/logger";
import { getChatHtml } from "@/ui/chatHtml";

export class ChatViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = "codexq.chatView";

  private view: vscode.WebviewView | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly core: CoreManager,
    private readonly logger: Logger | null = null
  ) {}

  async resolveWebviewView(view: vscode.WebviewView): Promise<void> {
    this.view = view;
    const { webview } = view;

    this.logger?.info?.("chat-view: resolve start");
    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
        vscode.Uri.joinPath(this.context.extensionUri, "dist"),
        this.context.extensionUri,
      ],
    };
    // Message handling from the webview — register BEFORE setting HTML
    let handshake = false;
    const recv = webview.onDidReceiveMessage(async (msg) => {
      try {
        if (!msg || typeof msg !== "object") return;
        const type = msg.type as string | undefined;
        this.logger?.info?.("from webview", { type });

        if (type === "ui.ready") {
          handshake = true;
          const di = this.core.diContainer;
          const sessionStore = di.has("sessionStore")
            ? di.resolve<import("@/state/session-store").SessionStore>(
                "sessionStore"
              )
            : null;
          const config = this.core.config.getAll();
          const features = this.core.config.getFeatures();

          const session = sessionStore?.getCurrentSession() ?? null;
          let uiMessages = session
            ? session.messages.map((m) => ({
                id: m.id,
                role: m.role === "system" ? ("assistant" as const) : m.role,
                text: m.content,
              }))
            : [];

          // Provide a friendly placeholder when there is no history
          if (!uiMessages.length) {
            uiMessages = [
              {
                id: "welcome",
                role: "assistant" as const,
                text: "Hi! I’m Codex. Ask me to refactor, write tests, or explain code. Drag files in to add context.",
              },
            ];
          }

          this.logger?.info?.("chat-view: posting init");
          webview.postMessage({
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
          const streaming = this.core.config.getFeatures().streaming;
          const options: Record<string, unknown> = {};
          if (hasAttachments) options["attachments"] = attachments;
          if (hasEmbedded) options["embeddedFiles"] = embeddedFiles;
          this.logger?.info?.("chat-view: userMessage", {
            textLen: (text ?? "").length,
            hasAttachments,
            attachmentsCount: Array.isArray(attachments)
              ? attachments.length
              : 0,
            hasEmbedded,
            embeddedCount: Array.isArray(embeddedFiles)
              ? embeddedFiles.length
              : 0,
          });
          this.core.eventBusInstance.publish(Events.UiSend, {
            text: text ?? "",
            streaming,
            options: Object.keys(options).length ? options : undefined,
          });
          return;
        }

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
            webview.postMessage({
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
              webview.postMessage({
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
                Math.max(1, Math.min(200, limit ?? 100))
              );
              const sum = files.summary();
              webview.postMessage({
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
              const items = files.listChildren(path ?? "");
              const sum = files.summary();
              webview.postMessage({
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
              const item = files.stat(path ?? "");
              const sum = files.summary();
              webview.postMessage({
                type: "files/result",
                op: "stat",
                items: item ? [item] : [],
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
              const items = files.resolveDrop(dropped ?? []);
              const sum = files.summary();
              webview.postMessage({
                type: "files/result",
                op: "resolveDrop",
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
            }
          } catch (e) {
            const sum = files.summary();
            const err = e instanceof Error ? e.message : String(e);
            webview.postMessage({
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
    this.disposables.push(recv);

    // Now set HTML after receiver is in place
    webview.html = await getChatHtml(
      this.context,
      webview,
      this.logger ?? null
    );
    this.logger?.info?.("chat-view: html set");
    // Retry sending init every 5s for up to 1 minute in case handshake was missed
    let __attempts = 0;
    const __maxAttempts = 1;
    const __retryTimer = setInterval(async () => {
      try {
        __attempts += 1;
        this.logger?.info?.("chat-view: init retry", { attempt: __attempts });
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
              role: m.role === "system" ? ("assistant" as const) : m.role,
              text: m.content,
            }))
          : [];
        webview.postMessage({
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
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        this.logger?.warn?.("chat-view: init retry failed", { error: m });
      } finally {
        if (__attempts >= __maxAttempts) {
          clearInterval(__retryTimer);
        }
      }
    }, 5000);
    this.disposables.push({ dispose: () => clearInterval(__retryTimer) });

    // Track visibility in a context key for menu gating
    void vscode.commands.executeCommand(
      "setContext",
      "codexq.chatVisible",
      !!view.visible
    );
    const vis = view.onDidChangeVisibility(() => {
      void vscode.commands.executeCommand(
        "setContext",
        "codexq.chatVisible",
        !!view.visible
      );
    });
    this.disposables.push(vis);

    // Warn if handshake not received shortly (helps diagnose messaging)
    setTimeout(() => {
      if (!handshake) {
        this.logger?.warn?.(
          "chat-view: ui.ready not received (check webview console)"
        );
      }
    }, 2000);

    // Subscribe to transport events and forward to the webview
    const onToken = (payload: import("@core/events").TransportTokenPayload) => {
      try {
        webview.postMessage({ type: "assistant.token", token: payload.token });
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        this.logger?.warn?.("post assistant.token failed", { error: m });
      }
    };
    const onComplete = async (
      _payload: import("@core/events").TransportCompletePayload
    ) => {
      try {
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
          if (text) webview.postMessage({ type: "assistant.commit", text });
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        this.logger?.warn?.("assistant.commit post failed", { error: m });
      }
    };
    const onError = (payload: import("@core/events").TransportErrorPayload) => {
      this.logger?.error?.("transport error", { error: payload.error });
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

    // Watch assets and refresh the view HTML on change
    const assetPattern = new vscode.RelativePattern(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "chat"),
      "**/*.{css,js}"
    );
    const htmlPattern = new vscode.RelativePattern(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "chat", "html"),
      "**/*.html"
    );
    const watcherAssets =
      vscode.workspace.createFileSystemWatcher(assetPattern);
    const watcherHtml = vscode.workspace.createFileSystemWatcher(htmlPattern);
    let refreshTimer: NodeJS.Timeout | undefined;
    const refresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        if (this.view) {
          this.view.webview.html = await getChatHtml(
            this.context,
            this.view.webview,
            this.logger ?? null
          );
        }
      }, 150);
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

  reveal() {
    return vscode.commands.executeCommand(
      "workbench.view.showView",
      ChatViewProvider.viewId
    );
  }

  dispose() {
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch {}
    }
    this.disposables = [];
  }
}
