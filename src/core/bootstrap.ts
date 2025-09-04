import * as vscode from "vscode";
import { Logger } from "@/telemetry/logger";
import { registerCoreCommands } from "@/ext/registrations/commands";
import { createLogsStatusItem } from "@/ui/statusbar/logs-button";
import { createSidebarToggleItem } from "@/ui/statusbar/sidebar-toggle";
import { CoreManager } from "@/core/manager";
import { ChatViewProvider } from "@/ui/chat-view-provider";

export async function bootstrap(context: vscode.ExtensionContext) {
  const logger = new Logger();
  context.subscriptions.push(logger);

  logger.info("Codex extension activated");

  // Initialize core services
  const core = new CoreManager(context, logger);
  context.subscriptions.push(core);
  await core.initialize();

  // Register commands (kept in their own module)
  const disposables = registerCoreCommands(context, core, logger);
  context.subscriptions.push(...disposables);

  // Register launcher view in Activity Bar (auto-opens panel and closes sidebar)
  const provider = new ChatViewProvider(context, core, logger);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewId, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  // Optional: status bar button to open the Output channel
  const statusItem = createLogsStatusItem();
  context.subscriptions.push(statusItem);

  // Sidebar toggle button (Status Bar)
  const sidebarToggle = createSidebarToggleItem();
  context.subscriptions.push(sidebarToggle);

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
