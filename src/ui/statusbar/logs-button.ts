import * as vscode from "vscode";

export function createLogsStatusItem(): vscode.Disposable {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.text = "$(rocket) Codex";
  item.command = "codex.showMenu";
  item.tooltip = "Open Codex menu";
  item.show();
  return item;
}
