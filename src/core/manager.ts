// src/core/manager.ts
import * as vscode from "vscode";
import { EventBus } from "@/core/event-bus";
import { ConfigService } from "@/core/config";
import { PolicyGuard } from "@/core/policy";
import { DIContainer } from "@/core/di";
import { Logger } from "@/telemetry/logger.js";
import { SettingsManager } from "@/config/settings";

export class CoreManager implements vscode.Disposable {
  private readonly eventBus = new EventBus();
  private readonly configService = new ConfigService();
  private readonly policyGuard = new PolicyGuard();
  private readonly di = new DIContainer();

  private disposables: vscode.Disposable[] = [];
  private initialized = false;
  private disposed = false;

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

    this.di.register("eventBus", this.eventBus);
    this.di.register("configService", this.configService);
    this.di.register("policyGuard", this.policyGuard);
    this.di.register("context", this.context);

    // Track a trivial disposable to mark lifecycle hookup (optional)
    this.trackDisposable(
      new vscode.Disposable(() => this.logInfo("CoreManager: disposed hook"))
    );

    this.initialized = true;
    this.logInfo("CoreManager: ready");
    this.eventBus.publish("core:ready");
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

  async shutdown(): Promise<void> {
    if (!this.initialized || this.disposed) return;
    this.logInfo("CoreManager: shutting down...");

    // Notify listeners
    this.eventBus.publish("core:shutdown");

    // Dispose registered resources
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch (e) {
        this.logError("dispose failed", e);
      }
    }
    this.disposables = [];

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

  private logInfo(msg: string, meta?: Record<string, unknown>) {
    this.logger?.info?.(msg, meta);
  }
  private logError(msg: string, err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    this.logger?.error?.(msg, { error: m });
  }
}
