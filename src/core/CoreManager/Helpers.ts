// src/core/CoreManager/Helpers.ts
import * as vscode from "vscode";
import type { Logger } from "@/telemetry/logger.js";

export class Helpers {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly logger: Logger | null = null
  ) {}

  public trackDisposable(disposables: vscode.Disposable[], d?: vscode.Disposable) {
    if (!d) return;
    disposables.push(d);
    this.context.subscriptions.push(d);
  }

  public logInfo(msg: string, logger: Logger | null, meta?: Record<string, unknown>) {
    logger?.info?.(msg, meta);
  }

  public logError(msg: string, logger: Logger | null, err: unknown) {
    const m = err instanceof Error ? err.message : String(err);
    logger?.error?.(msg, { error: m });
  }

  public logWarn(msg: string, logger: Logger | null, meta?: Record<string, unknown>) {
    logger?.warn?.(msg, meta);
  }
}