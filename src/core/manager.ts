// src/core/manager.ts
import * as vscode from "vscode";
import { EventBus } from "@/core/event-bus";
import { ConfigService } from "@/core/config";
import { PolicyGuard } from "@/core/policy";
import { DIContainer } from "@/core/di";
import type { Logger } from "@/telemetry/logger.js";
import { SettingsManager } from "@/config/settings";
import { SessionStore } from "@/state/session-store";
import { ToolBus } from "@/tools/tool-bus";
import { FilesService } from "@/files/service";
import { CodexClient } from "@/transport/client";
import type { ChatSession } from "@/types/chat";
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

export class CoreManager implements vscode.Disposable {
  private readonly eventBus = new EventBus();
  private readonly configService = new ConfigService();
  private readonly policyGuard = new PolicyGuard();
  private readonly di = new DIContainer();
  private sessionStore: SessionStore | null = null;
  private toolBus: ToolBus | null = null;
  private client: CodexClient | null = null;
  private files: FilesService | null = null;

  private disposables: vscode.Disposable[] = [];
  private initialized = false;
  private disposed = false;
  // Event handlers we register so we can unsubscribe on shutdown
  private onUiSendWrapped: ((...args: unknown[]) => void) | null = null;
  private onToolInvokeWrapped: ((...args: unknown[]) => void) | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    public readonly logger: Logger | null = null
  ) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.logInfo("CoreManager: initializing...");

    await this.configService.load();
    if (this.logger) {
      this.configService.setLogger(this.logger);
      this.policyGuard.setLogger(this.logger);
      this.eventBus.setLogger(this.logger);
      SettingsManager.setLogger(this.logger);
    }

    // Instantiate additional services (logger-aware)
    this.sessionStore = new SessionStore(this.context, this.logger ?? null);
    this.toolBus = new ToolBus();
    if (this.logger) {
      this.toolBus.setLogger(this.logger);
    }
    this.client = new CodexClient(this.configService, this.logger ?? null);
    this.files = new FilesService(this.logger ?? null);

    // Initialize policy guard after logger/config are ready
    try {
      await this.policyGuard.initialize();
      this.logInfo("PolicyGuard: initialized");
    } catch (e) {
      this.logError("PolicyGuard initialize failed", e);
    }

    // Register DI singletons in stable order
    this.di.register("eventBus", this.eventBus);
    this.di.register("configService", this.configService);
    this.di.register("policyGuard", this.policyGuard);
    this.di.register("context", this.context);
    if (this.logger) {
      this.di.register("logger", this.logger);
    }
    if (this.sessionStore) this.di.register("sessionStore", this.sessionStore);
    if (this.toolBus) this.di.register("toolBus", this.toolBus);
    if (this.client) this.di.register("codexClient", this.client);
    if (this.files) this.di.register("filesService", this.files);

    // Track a trivial disposable to mark lifecycle hookup (optional)
    this.trackDisposable(
      new vscode.Disposable(() => this.logInfo("CoreManager: disposed hook"))
    );

    // Subscribe to runtime events (Stage 5: transport routing)
    this.registerEventHandlers();

    this.initialized = true;
    this.logInfo("CoreManager: ready", {
      features: this.configService.getFeatures(),
    });
    this.eventBus.publish(Events.CoreReady);

    // Start files indexing (non-blocking)
    try { await this.files?.initialize(); } catch (e) { this.logWarn("FilesService init failed", { error: e instanceof Error ? e.message : String(e) }); }

    // If session history exists, emit a restoration event for UI/state listeners
    try {
      const current = this.sessionStore?.getCurrentSession();
      if (current && current.messages.length > 0) {
        this.eventBus.publish(Events.SessionRestored, {
          session: current,
          messageCount: current.messages.length,
        });
        this.logInfo("Session restored", {
          sessionId: current.id,
          messages: current.messages.length,
        });
      }
    } catch (e) {
      this.logError("session restore check failed", e);
    }
  }

  get diContainer(): DIContainer {
    return this.di;
  }
  get eventBusInstance(): EventBus {
    return this.eventBus;
  }
  get config(): ConfigService {
    return this.configService;
  }
  get policies(): PolicyGuard {
    return this.policyGuard;
  }
  get session(): SessionStore | null {
    return this.sessionStore;
  }
  get tools(): ToolBus | null {
    return this.toolBus;
  }
  get codex(): CodexClient | null {
    return this.client;
  }
  get filesService(): FilesService | null {
    return this.files;
  }

  // Convenience helpers — Session access
  async getOrCreateSession(): Promise<ChatSession> {
    const existing = this.sessionStore?.getCurrentSession();
    if (existing) return existing;
    if (!this.sessionStore) throw new Error("SessionStore not available");
    return await this.sessionStore.createSession();
  }
  getCurrentSession(): ChatSession | null {
    return this.sessionStore?.getCurrentSession() ?? null;
  }

  async shutdown(): Promise<void> {
    if (!this.initialized || this.disposed) return;
    this.logInfo("CoreManager: shutting down...");

    // Notify listeners
    this.eventBus.publish(Events.CoreShutdown);

    // Unsubscribe event handlers registered by CoreManager
    if (this.onUiSendWrapped) {
      this.eventBus.unsubscribe(Events.UiSend, this.onUiSendWrapped);
      this.onUiSendWrapped = null;
    }
    if (this.onToolInvokeWrapped) {
      this.eventBus.unsubscribe(Events.ToolInvoke, this.onToolInvokeWrapped);
      this.onToolInvokeWrapped = null;
    }

    // Dispose registered resources
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch (e) {
        this.logError("dispose failed", e);
      }
    }
    this.disposables = [];

    // Shutdown policy guard and persist session store if present
    try {
      await this.policyGuard.shutdown();
    } catch (e) {
      this.logError("policy guard shutdown failed", e);
    }
    try {
      await this.sessionStore?.dispose();
    } catch (e) {
      this.logError("session store dispose failed", e);
    }

    // Dispose event bus handlers map to free memory (best-effort)
    try {
      this.eventBus.dispose();
    } catch (e) {
      this.logError("event bus dispose failed", e);
    }

    this.initialized = false;
    this.disposed = true;
    this.logInfo("CoreManager: shutdown complete");
  }

  // vscode.Disposable implementation
  dispose(): void {
    // Fire-and-forget to satisfy sync signature
    this.shutdown().catch((e) => this.logError("shutdown error", e));
  }

  // — helpers —
  private trackDisposable(d?: vscode.Disposable) {
    if (!d) return;
    this.disposables.push(d);
    this.context.subscriptions.push(d);
  }

  // — runtime event wiring —
  private registerEventHandlers() {
    // UI send handler (wrapped to satisfy EventBus signature)
    const handleUiSend = async (payload: UiSendPayload) => {
      try {
        const text = (payload?.text ?? "").toString();
        if (!text.trim()) return;

        this.logInfo("ui:send received", {
          streaming: payload.streaming ?? this.configService.getFeatures().streaming,
          length: text.length,
        });

        // Policy checks
        if (!this.policyGuard.isFeatureAllowed("chat.send")) {
          this.logWarn("Feature not allowed: chat.send");
          return;
        }
        const rlKey = "chat:send";
        if (!this.policyGuard.isWithinRateLimit(rlKey)) {
          this.logWarn("Rate limit exceeded for chat.send");
          return;
        }

        const session = await this.getOrCreateSession();
        const userMsg = await this.sessionStore!.addMessageToCurrentSession({
          role: "user",
          content: text,
        });

        // Notify transport started
        const started: TransportStartedPayload = {
          sessionId: session.id,
          messageId: userMsg.id,
        };
        this.eventBus.publish(Events.TransportStarted, started);
        this.logInfo("transport started", started as unknown as Record<string, unknown>);

        const streaming = payload.streaming ?? this.configService.getFeatures().streaming;

        if (streaming) {
          let buffer = "";
          let tokenCount = 0;
          await this.codex!.streamResponse(text, (token: string) => {
            buffer += token;
            tokenCount++;
            const tok: TransportTokenPayload = {
              sessionId: session.id,
              messageId: userMsg.id,
              token,
            };
            this.eventBus.publish(Events.TransportToken, tok);
          }, payload.options);

          await this.sessionStore!.addMessageToCurrentSession({
            role: "assistant",
            content: buffer,
          });

          const done: TransportCompletePayload = {
            sessionId: session.id,
            messageId: userMsg.id,
          };
          this.eventBus.publish(Events.TransportComplete, done);
          this.logInfo("transport complete", {
            sessionId: session.id,
            messageId: userMsg.id,
            tokens: tokenCount,
            streaming: true,
          });
          this.policyGuard.recordRequest(rlKey);
        } else {
          const res = await this.codex!.sendMessage(text, payload.options);
          const content = typeof res === "string" ? res : JSON.stringify(res);
          await this.sessionStore!.addMessageToCurrentSession({
            role: "assistant",
            content,
          });
          const done: TransportCompletePayload = {
            sessionId: session.id,
            messageId: userMsg.id,
          };
          this.eventBus.publish(Events.TransportComplete, done);
          this.logInfo("transport complete", {
            sessionId: session.id,
            messageId: userMsg.id,
            streaming: false,
          });
          this.policyGuard.recordRequest(rlKey);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const errEvt: TransportErrorPayload = { error: message };
        this.eventBus.publish(Events.TransportError, errEvt);
        this.logError("ui:send handling failed", e);
      }
    };

    this.onUiSendWrapped = (...args: unknown[]) => {
      void handleUiSend(args[0] as UiSendPayload);
    };

    // Subscribe
    this.eventBus.subscribe(Events.UiSend, this.onUiSendWrapped);

    // Tool invoke handler
    const handleToolInvoke = async (payload: ToolInvokePayload) => {
      const name = payload?.name;
      try {
        if (!name) return;
        if (!this.toolBus) throw new Error("ToolBus not available");
        this.logInfo("tool invoke", { name });
        const result = await this.toolBus.execute(name, payload.args);
        const evt: ToolResultPayload = { name, result };
        this.eventBus.publish(Events.ToolResult, evt);
        this.logInfo("tool result", { name });
        // Optionally persist as assistant tool output
        try {
          if (this.sessionStore) {
            const pretty = typeof result === "string" ? result : JSON.stringify(result);
            await this.getOrCreateSession();
            await this.sessionStore.addMessageToCurrentSession({
              role: "assistant",
              content: `Tool ${name} result:\n${pretty}`,
            });
          }
        } catch (persistErr) {
          this.logWarn("Failed to persist tool result", { name });
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        const evt: ToolErrorPayload = { name: name ?? "<unknown>", error: errMsg };
        this.eventBus.publish(Events.ToolError, evt);
        this.logError("tool:invoke handling failed", e);
      }
    };
    this.onToolInvokeWrapped = (...args: unknown[]) => {
      void handleToolInvoke(args[0] as ToolInvokePayload);
    };
    this.eventBus.subscribe(Events.ToolInvoke, this.onToolInvokeWrapped);
  }

  private logInfo(msg: string, meta?: Record<string, unknown>) {
    this.logger?.info?.(msg, meta);
  }
  private logError(msg: string, err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    this.logger?.error?.(msg, { error: m });
  }
  private logWarn(msg: string, meta?: Record<string, unknown>) {
    this.logger?.warn?.(msg, meta);
  }
}
