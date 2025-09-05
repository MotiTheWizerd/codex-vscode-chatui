import * as vscode from "vscode";
import { log as logger } from "@/telemetry/log";
import { registerCoreCommands } from "@/ext/registrations/commands";
import { createLogsStatusItem } from "@/ui/statusbar/logs-button";
import { CoreManager } from "@/core/manager";

export async function bootstrap(context: vscode.ExtensionContext) {
  context.subscriptions.push(logger);

  logger.info("Codex extension activated");

  // Initialize core services
  const core = new CoreManager(context, logger);
  context.subscriptions.push(core);
  await core.initialize();

  // Register commands (kept in their own module)
  const disposables = registerCoreCommands(context, core);
  context.subscriptions.push(...disposables);

  // Sidebar Activity Bar view removed; no WebviewView provider registration

  // Optional: status bar button to open the Output channel
  const statusItem = createLogsStatusItem();
  context.subscriptions.push(statusItem);

  // Sidebar toggle button removed

  // Show logs once on first activate (optional)
  // logger.show();

  // Auto-open chat panel on startup using the same command handler
  try {
    await vscode.commands.executeCommand("codex.openChatPanel");
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    logger.error("Failed to auto-open chat panel", { error: m });
  }
}
