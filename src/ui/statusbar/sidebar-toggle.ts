import * as vscode from "vscode";

export function createSidebarToggleItem(): vscode.Disposable {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
  item.text = "$(panelLeft) Sidebar";
  item.tooltip = "Toggle Sidebar Visibility";
  item.command = "codex.toggleSidebar";
  item.show();
  return item;
}

