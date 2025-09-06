// src/core/CoreManager/CoreManager.ts
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
import { EventHandler } from "./EventHandler";
import { InitializationManager } from "./InitializationManager";
import { ShutdownManager } from "./ShutdownManager";
import { SessionManager } from "./SessionManager";
import { Helpers } from "./Helpers";

export class CoreManager implements vscode.Disposable {
  private readonly eventBus = new EventBus();
  private readonly configService = new ConfigService();
  private readonly policyGuard = new PolicyGuard();
  private readonly di = new DIContainer();
  public sessionStore: SessionStore | null = null;
  public toolBus: ToolBus | null = null;
  public client: CodexClient | null = null;
  public files: FilesService | null = null;

  public disposables: vscode.Disposable[] = [];
  public initialized = false;
  public disposed = false;

  // Module managers
  public readonly eventHandler: EventHandler;
  public readonly initializationManager: InitializationManager;
  public readonly shutdownManager: ShutdownManager;
  public readonly sessionManager: SessionManager;
  public readonly helpers: Helpers;

  constructor(
    public readonly context: vscode.ExtensionContext,
    public readonly logger: Logger | null = null
  ) {
    this.eventHandler = new EventHandler(this);
    this.initializationManager = new InitializationManager(this);
    this.shutdownManager = new ShutdownManager(this);
    this.sessionManager = new SessionManager(this);
    this.helpers = new Helpers(context, logger);
  }

  // Getters for accessing internal services
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

  async initialize(): Promise<void> {
    return this.initializationManager.initialize();
  }

  async shutdown(): Promise<void> {
    return this.shutdownManager.shutdown();
  }

  // Convenience helpers — Session access
  async getOrCreateSession(): Promise<ChatSession> {
    return this.sessionManager.getOrCreateSession();
  }
  getCurrentSession(): ChatSession | null {
    return this.sessionManager.getCurrentSession();
  }

  // vscode.Disposable implementation
  dispose(): void {
    // Fire-and-forget to satisfy sync signature
    this.shutdown().catch((e) => this.logError("shutdown error", e));
  }

  // Helper methods
  public trackDisposable(d?: vscode.Disposable) {
    this.helpers.trackDisposable(this.disposables, d);
  }

  public logInfo(msg: string, meta?: Record<string, unknown>) {
    this.helpers.logInfo(msg, this.logger, meta);
  }
  public logError(msg: string, err: unknown) {
    this.helpers.logError(msg, this.logger, err);
  }
  public logWarn(msg: string, meta?: Record<string, unknown>) {
    this.helpers.logWarn(msg, this.logger, meta);
  }
}
