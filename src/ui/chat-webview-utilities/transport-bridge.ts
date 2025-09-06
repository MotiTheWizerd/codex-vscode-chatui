import * as vscode from "vscode";
import type { EventBus } from "@/core/event-bus";
import type { CoreManager } from "@/core/manager";
import type { Logger } from "@/telemetry/logger.js";
import { Events } from "@core/events";

/**
 * Subscribes to transport events and forwards updates to the webview.
 * Returns a Disposable that unsubscribes all handlers.
 */
export function attachTransportBridge(
  bus: EventBus,
  panel: vscode.WebviewPanel,
  core: CoreManager,
  logger?: Logger | null
): vscode.Disposable {
  const onToken = (payload: import("@core/events").TransportTokenPayload) => {
    try {
      panel.webview.postMessage({ type: "assistant.token", token: payload.token });
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      logger?.warn?.("post assistant.token failed", { error: m });
    }
  };

  const onComplete = async (
    _payload: import("@core/events").TransportCompletePayload
  ) => {
    try {
      const di = core.diContainer;
      if (di.has("sessionStore")) {
        const store = di.resolve<import("@/state/session-store").SessionStore>(
          "sessionStore"
        );
        const session = store.getCurrentSession();
        const last = session?.messages
          .slice()
          .reverse()
          .find((m) => m.role === "assistant");
        const text = last?.content ?? "";
        if (text) panel.webview.postMessage({ type: "assistant.commit", text });
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      logger?.warn?.("assistant.commit post failed", { error: m });
    }
  };

  const onError = (
    payload: import("@core/events").TransportErrorPayload
  ) => {
    logger?.error?.("transport error", { error: payload.error });
  };

  bus.subscribe(Events.TransportToken, onToken as any);
  bus.subscribe(Events.TransportComplete, onComplete as any);
  bus.subscribe(Events.TransportError, onError as any);

  return new vscode.Disposable(() => {
    bus.unsubscribe(Events.TransportToken, onToken as any);
    bus.unsubscribe(Events.TransportComplete, onComplete as any);
    bus.unsubscribe(Events.TransportError, onError as any);
  });
}

