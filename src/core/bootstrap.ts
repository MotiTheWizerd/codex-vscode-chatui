import * as vscode from "vscode";
import { log as logger } from "@/telemetry/log";
import { registerCoreCommands } from "@/ext/registrations/commands";
import { createLogsStatusItem } from "@/ui/statusbar/logs-button";
import { ChatViewProvider } from "@/ui/chat-view-provider";
import { CoreManager } from "@/core/manager";

export async function bootstrap(context: vscode.ExtensionContext) {
  context.subscriptions.push(logger);

  logger.info("Codex extension activated");

  // Create core early (no awaits yet)
  const core = new CoreManager(context, logger);
  context.subscriptions.push(core);

  // Register WebviewView provider for Sidebar Chat BEFORE any awaits
  const provider = new ChatViewProvider(context, core, logger);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ChatViewProvider.viewId,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    ),
    vscode.commands.registerCommand("codexq.chat.focus", async () => {
      // Focus the exact view to avoid container collisions
      try {
        await vscode.commands.executeCommand(
          "workbench.view.showView",
          ChatViewProvider.viewId
        );
      } catch {}
    })
  );

  // Now initialize core services
  await core.initialize();

  // Register commands (kept in their own module)
  const disposables = registerCoreCommands(context, core);
  context.subscriptions.push(...disposables);

  // Optional: status bar button to open the Output channel
  const statusItem = createLogsStatusItem();
  context.subscriptions.push(statusItem);

  // Sidebar toggle button removed

  // Show logs once on first activate (optional)
  // logger.show();

  // Auto-open the Codex Q chat view explicitly
  try {
    await vscode.commands.executeCommand(
      "workbench.view.showView",
      ChatViewProvider.viewId
    );
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    logger.warn?.("Failed to auto-open Codex Q view", { error: m });
  }
}
