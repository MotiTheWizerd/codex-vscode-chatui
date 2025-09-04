import * as vscode from "vscode";
import { Logger } from "@/telemetry/logger";
import { CoreManager } from "@/core/manager";
import { ChatPanelManager } from "@/ui/chat-panel-manager";

export function registerCoreCommands(
  context: vscode.ExtensionContext,
  core: CoreManager,
  logger: Logger
): vscode.Disposable[] {
  const showMenu = vscode.commands.registerCommand("codex.showMenu", async () => {
    const picks: Array<vscode.QuickPickItem & { id: string }> = [
      { id: "chat", label: "$(comment-discussion) Open Codex Chat" },
      { id: "logs", label: "$(output) Open Codex Logs" },
    ];
    const choice = await vscode.window.showQuickPick(picks, {
      placeHolder: "Codex",
      ignoreFocusOut: true,
      matchOnDetail: true,
    });
    if (!choice) return;
    if (choice.id === "chat") {
      vscode.commands.executeCommand("codex.openChatPanel");
    } else if (choice.id === "logs") {
      logger.show();
    }
  });

  const showLogs = vscode.commands.registerCommand("codex.showLogs", () => {
    logger.show();
  });

  const openChatPanel = vscode.commands.registerCommand(
    "codex.openChatPanel",
    () => {
      ChatPanelManager.open(context, core);
    }
  );

  const toggleSidebar = vscode.commands.registerCommand(
    "codex.toggleSidebar",
    async () => {
      await vscode.commands.executeCommand("workbench.action.toggleSidebarVisibility");
    }
  );

  return [showMenu, showLogs, openChatPanel, toggleSidebar];
}
