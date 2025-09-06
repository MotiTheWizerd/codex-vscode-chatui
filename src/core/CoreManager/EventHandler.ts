// src/core/CoreManager/EventHandler.ts
import { CoreManager } from "./CoreManager";
import { Events } from "@core/events";
import type {
  UiSendPayload,
  TransportStartedPayload,
  TransportTokenPayload,
  TransportCompletePayload,
  TransportErrorPayload,
  ToolInvokePayload,
  ToolResultPayload,
  ToolErrorPayload,
} from "@core/events";

export class EventHandler {
  private onUiSendWrapped: ((...args: unknown[]) => void) | null = null;
  private onToolInvokeWrapped: ((...args: unknown[]) => void) | null = null;

  constructor(private readonly manager: CoreManager) {}

  registerEventHandlers() {
    // UI send handler (wrapped to satisfy EventBus signature)
    const handleUiSend = async (payload: UiSendPayload) => {
      try {
        const text = (payload?.text ?? "").toString();
        if (!text.trim()) return;

        this.manager.logInfo("ui:send received", {
          streaming: payload.streaming ?? this.manager.config.getFeatures().streaming,
          length: text.length,
        });

        // Policy checks
        if (!this.manager.policies.isFeatureAllowed("chat.send")) {
          this.manager.logWarn("Feature not allowed: chat.send");
          return;
        }
        const rlKey = "chat:send";
        if (!this.manager.policies.isWithinRateLimit(rlKey)) {
          this.manager.logWarn("Rate limit exceeded for chat.send");
          return;
        }

        const session = await this.manager.sessionManager.getOrCreateSession();
        const userMsg = await this.manager.sessionStore!.addMessageToCurrentSession({
          role: "user",
          content: text,
        });

        // Notify transport started
        const started: TransportStartedPayload = {
          sessionId: session.id,
          messageId: userMsg.id,
        };
        this.manager.eventBusInstance.publish(Events.TransportStarted, started);
        this.manager.logInfo("transport started", started as unknown as Record<string, unknown>);

        const streaming = payload.streaming ?? this.manager.config.getFeatures().streaming;

        if (streaming) {
          let buffer = "";
          let tokenCount = 0;
          await this.manager.codex!.streamResponse(text, (token: string) => {
            buffer += token;
            tokenCount++;
            const tok: TransportTokenPayload = {
              sessionId: session.id,
              messageId: userMsg.id,
              token,
            };
            this.manager.eventBusInstance.publish(Events.TransportToken, tok);
          }, payload.options);

          await this.manager.sessionStore!.addMessageToCurrentSession({
            role: "assistant",
            content: buffer,
          });

          const done: TransportCompletePayload = {
            sessionId: session.id,
            messageId: userMsg.id,
          };
          this.manager.eventBusInstance.publish(Events.TransportComplete, done);
          this.manager.logInfo("transport complete", {
            sessionId: session.id,
            messageId: userMsg.id,
            tokens: tokenCount,
            streaming: true,
          });
          this.manager.policies.recordRequest(rlKey);
        } else {
          const res = await this.manager.codex!.sendMessage(text, payload.options);
          const content = typeof res === "string" ? res : JSON.stringify(res);
          await this.manager.session!.addMessageToCurrentSession({
            role: "assistant",
            content,
          });
          const done: TransportCompletePayload = {
            sessionId: session.id,
            messageId: userMsg.id,
          };
          this.manager.eventBusInstance.publish(Events.TransportComplete, done);
          this.manager.logInfo("transport complete", {
            sessionId: session.id,
            messageId: userMsg.id,
            streaming: false,
          });
          this.manager.policies.recordRequest(rlKey);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const errEvt: TransportErrorPayload = { error: message };
        this.manager.eventBusInstance.publish(Events.TransportError, errEvt);
        this.manager.logError("ui:send handling failed", e);
      }
    };

    this.onUiSendWrapped = (...args: unknown[]) => {
      void handleUiSend(args[0] as UiSendPayload);
    };

    // Subscribe
    this.manager.eventBusInstance.subscribe(Events.UiSend, this.onUiSendWrapped);

    // Tool invoke handler
    const handleToolInvoke = async (payload: ToolInvokePayload) => {
      const name = payload?.name;
      try {
        if (!name) return;
        if (!this.manager.tools) throw new Error("ToolBus not available");
        this.manager.logInfo("tool invoke", { name });
        const result = await this.manager.tools.execute(name, payload.args);
        const evt: ToolResultPayload = { name, result };
        this.manager.eventBusInstance.publish(Events.ToolResult, evt);
        this.manager.logInfo("tool result", { name });
        // Optionally persist as assistant tool output
        try {
          if (this.manager.session) {
            const pretty = typeof result === "string" ? result : JSON.stringify(result);
            await this.manager.sessionManager.getOrCreateSession();
            await this.manager.session.addMessageToCurrentSession({
              role: "assistant",
              content: `Tool ${name} result:
${pretty}`,
            });
          }
        } catch (persistErr) {
          this.manager.logWarn("Failed to persist tool result", { name });
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        const evt: ToolErrorPayload = { name: name ?? "<unknown>", error: errMsg };
        this.manager.eventBusInstance.publish(Events.ToolError, evt);
        this.manager.logError("tool:invoke handling failed", e);
      }
    };
    this.onToolInvokeWrapped = (...args: unknown[]) => {
      void handleToolInvoke(args[0] as ToolInvokePayload);
    };
    this.manager.eventBusInstance.subscribe(Events.ToolInvoke, this.onToolInvokeWrapped);
  }

  unregisterEventHandlers() {
    // Unsubscribe event handlers registered by CoreManager
    if (this.onUiSendWrapped) {
      this.manager.eventBusInstance.unsubscribe(Events.UiSend, this.onUiSendWrapped);
      this.onUiSendWrapped = null;
    }
    if (this.onToolInvokeWrapped) {
      this.manager.eventBusInstance.unsubscribe(Events.ToolInvoke, this.onToolInvokeWrapped);
      this.onToolInvokeWrapped = null;
    }
  }
}