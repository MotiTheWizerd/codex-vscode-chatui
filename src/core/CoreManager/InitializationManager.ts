// src/core/CoreManager/InitializationManager.ts
import * as vscode from "vscode";
import { CoreManager } from "./CoreManager";
import { SessionStore } from "@/state/session-store";
import { ToolBus } from "@/tools/tool-bus";
import { FilesService } from "@/files/service";
import { CodexClient } from "@/transport/client";
import { SettingsManager } from "@/config/settings";
import { Events } from "@core/events";

export class InitializationManager {
  constructor(private readonly manager: CoreManager) {}

  async initialize(): Promise<void> {
    if (this.manager.initialized) return;
    this.manager.logInfo("CoreManager: initializing...");

    await this.manager.config.load();
    if (this.manager.logger) {
      this.manager.config.setLogger(this.manager.logger);
      this.manager.policies.setLogger(this.manager.logger);
      this.manager.eventBusInstance.setLogger(this.manager.logger);
      SettingsManager.setLogger(this.manager.logger);
    }

    // Instantiate additional services (logger-aware)
    this.manager.sessionStore = new SessionStore(this.manager.context, this.manager.logger ?? null);
    this.manager.toolBus = new ToolBus();
    if (this.manager.logger) {
      this.manager.toolBus.setLogger(this.manager.logger);
    }
    this.manager.client = new CodexClient(this.manager.config, this.manager.logger ?? null);
    this.manager.files = new FilesService(this.manager.logger ?? null);

    // Initialize policy guard after logger/config are ready
    try {
      await this.manager.policies.initialize();
      this.manager.logInfo("PolicyGuard: initialized");
    } catch (e) {
      this.manager.logError("PolicyGuard initialize failed", e);
    }

    // Register DI singletons in stable order
    this.manager.diContainer.register("eventBus", this.manager.eventBusInstance);
    this.manager.diContainer.register("configService", this.manager.config);
    this.manager.diContainer.register("policyGuard", this.manager.policies);
    this.manager.diContainer.register("context", this.manager.context);
    if (this.manager.logger) {
      this.manager.diContainer.register("logger", this.manager.logger);
    }
    if (this.manager.sessionStore) this.manager.diContainer.register("sessionStore", this.manager.sessionStore);
    if (this.manager.toolBus) this.manager.diContainer.register("toolBus", this.manager.toolBus);
    if (this.manager.client) this.manager.diContainer.register("codexClient", this.manager.client);
    if (this.manager.files) this.manager.diContainer.register("filesService", this.manager.files);

    // Track a trivial disposable to mark lifecycle hookup (optional)
    this.manager.trackDisposable(
      new vscode.Disposable(() => this.manager.logInfo("CoreManager: disposed hook"))
    );

    // Subscribe to runtime events (Stage 5: transport routing)
    this.manager.eventHandler.registerEventHandlers();

    this.manager.initialized = true;
    this.manager.logInfo("CoreManager: ready", {
      features: this.manager.config.getFeatures(),
    });
    this.manager.eventBusInstance.publish(Events.CoreReady);

    // Start files indexing (non-blocking)
    try { await this.manager.filesService?.initialize(); } catch (e) { this.manager.logWarn("FilesService init failed", { error: e instanceof Error ? e.message : String(e) }); }

    // If session history exists, emit a restoration event for UI/state listeners
    try {
      const current = this.manager.session?.getCurrentSession();
      if (current && current.messages.length > 0) {
        this.manager.eventBusInstance.publish(Events.SessionRestored, {
          session: current,
          messageCount: current.messages.length,
        });
        this.manager.logInfo("Session restored", {
          sessionId: current.id,
          messages: current.messages.length,
        });
      }
    } catch (e) {
      this.manager.logError("session restore check failed", e);
    }
  }
}