// src/extension.ts
import * as vscode from "vscode";
import { CoreManager } from "@/core/manager";
import { Logger } from "@/telemetry/logger.js";

let core: CoreManager | null = null;
let logger: Logger | null = null;

export async function activate(context: vscode.ExtensionContext) {
  try {
    logger = new Logger();
    logger.info("Activating Codex...");

    core = new CoreManager(context, logger);
    context.subscriptions.push(core); // auto-dispose on deactivate
    await core.initialize();

    logger.info("Codex activated.");
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    vscode.window.showErrorMessage("Codex failed to activate. See Output.");
    logger?.error("Activation error", { error: m });
  }
}

export async function deactivate() {
  try {
    await core?.shutdown(); // optional; VS Code will also call dispose()
    logger?.info("Codex deactivated.");
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    logger?.error("Deactivation error", { error: m });
  } finally {
    logger?.dispose();
  }
}
