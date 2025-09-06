import * as vscode from "vscode";
import type { CoreManager } from "@/core/manager";
import type { Logger } from "@/telemetry/logger.js";
import { Events } from "@core/events";

/**
 * Returns a handler for `webview.onDidReceiveMessage` with identical behavior to the
 * original inline ChatWebview logic. It logs, validates, and routes messages to Core.
 */
export function createMessageHandler(
  core: CoreManager,
  panel: vscode.WebviewPanel,
  logger?: Logger | null
) {
  return async (msg: unknown) => {
    try {
      if (!msg || typeof msg !== "object") return;
      const anyMsg = msg as Record<string, any>;
      const type = anyMsg["type"] as string | undefined;
      logger?.info?.("from webview", anyMsg);

      // Handshake: UI announced readiness → send init payload
      if (type === "ui.ready") {
        const di = core.diContainer;
        const sessionStore = di.has("sessionStore")
          ? di.resolve<import("@/state/session-store").SessionStore>(
              "sessionStore"
            )
          : null;
        const config = core.config.getAll();
        const features = core.config.getFeatures();

        const session = sessionStore?.getCurrentSession() ?? null;
        const uiMessages = session
          ? session.messages.map((m) => ({
              id: m.id,
              role: m.role === "system" ? ("assistant" as const) : m.role,
              text: m.content,
            }))
          : [];

        panel.webview.postMessage({
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
        const payload = anyMsg["payload"] as Record<string, any> | undefined;
        const text: string | undefined = payload?.["text"] ?? anyMsg["text"];
        const attachments: unknown[] | undefined =
          payload?.["attachments"] ?? anyMsg["attachments"];
        const embeddedFiles: string[] | undefined =
          payload?.["embeddedFiles"] ?? anyMsg["embeddedFiles"];
        const hasText = !!(text && text.trim());
        const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
        const hasEmbedded = Array.isArray(embeddedFiles) && embeddedFiles.length > 0;
        if (!hasText && !hasAttachments && !hasEmbedded) return;
        const streaming = core.config.getFeatures().streaming;
        const options: Record<string, unknown> = {};
        if (hasAttachments) options["attachments"] = attachments;
        if (hasEmbedded) options["embeddedFiles"] = embeddedFiles;
        core.eventBusInstance.publish(Events.UiSend, {
          text: text ?? "",
          streaming,
          options: Object.keys(options).length ? options : undefined,
        });
        return;
      }

      // Files bridge: index/search/listChildren/stat/resolveDrop
      if (
        type === "files/index" ||
        type === "files/search" ||
        type === "files/listChildren" ||
        type === "files/stat" ||
        type === "files/resolveDrop"
      ) {
        const payload = anyMsg["payload"] as Record<string, any> | undefined;
        const reqId: string | undefined = payload?.["reqId"] ?? anyMsg["reqId"];
        const limit: number | undefined = payload?.["limit"] ?? anyMsg["limit"];
        const q: string | undefined = payload?.["q"] ?? anyMsg["q"];
        const path: string | undefined = payload?.["path"] ?? anyMsg["path"];
        const dropped: string[] | undefined = payload?.["items"] ?? anyMsg["items"];
        const files = core.filesService;
        const t0 = Date.now();
        if (!files) {
          panel.webview.postMessage({
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
            const items = files.indexSlice(Math.max(1, Math.min(500, limit ?? 200)));
            const sum = files.summary();
            panel.webview.postMessage({
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
            const items = files.search(q ?? "", Math.max(1, Math.min(200, limit ?? 50)));
            const sum = files.summary();
            panel.webview.postMessage({
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
            panel.webview.postMessage({
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
            panel.webview.postMessage({
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
            if (res.bad.length) warnings.push(`${res.bad.length} items rejected`);
            if (res.truncated) warnings.push("truncated");
            panel.webview.postMessage({
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
          panel.webview.postMessage({
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
      logger?.error?.("webview message handling error", { error: m });
    }
  };
}
