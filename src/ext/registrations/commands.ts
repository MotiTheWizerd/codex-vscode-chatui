import * as vscode from "vscode";
import { log as logger } from "@/telemetry/log";
import { CoreManager } from "@/core/manager";
// Legacy panel manager retained but not used; we focus sidebar view instead

export function registerCoreCommands(
  context: vscode.ExtensionContext,
  core: CoreManager
): vscode.Disposable[] {
  const showMenu = vscode.commands.registerCommand("codexq.showMenu", async () => {
    const picks: Array<vscode.QuickPickItem & { id: string }> = [
      { id: "chat", label: "$(comment-discussion) Open Codex Q Chat" },
      { id: "logs", label: "$(output) Open Codex Q Logs" },
    ];
    const choice = await vscode.window.showQuickPick(picks, {
      placeHolder: "Codex Q",
      ignoreFocusOut: true,
      matchOnDetail: true,
    });
    if (!choice) return;
    if (choice.id === "chat") {
      vscode.commands.executeCommand("codexq.openChatPanel");
    } else if (choice.id === "logs") {
      logger.show();
    }
  });

  const showLogs = vscode.commands.registerCommand("codexq.showLogs", () => {
    logger.show();
  });

  const openChatPanel = vscode.commands.registerCommand(
    "codexq.openChatPanel",
    () => vscode.commands.executeCommand("codexq.chat.focus")
  );

  return [showMenu, showLogs, openChatPanel];
}
