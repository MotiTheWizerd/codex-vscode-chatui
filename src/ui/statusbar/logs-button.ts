import * as vscode from "vscode";

export function createLogsStatusItem(): vscode.Disposable {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.text = "$(rocket) Codex Q";
  item.command = "codexq.showMenu";
  item.tooltip = "Open Codex Q menu";
  item.show();
  return item;
}
