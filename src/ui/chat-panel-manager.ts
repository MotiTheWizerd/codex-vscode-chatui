// ui/chat-panel-manager.ts
import * as vscode from "vscode";
import { ChatWebview } from "@/ui/chat-webview";
import { CoreManager } from "@/core/manager";

export class ChatPanelManager {
  private static current: ChatWebview | null = null;

  static open(context: vscode.ExtensionContext, core: CoreManager) {
    if (this.current) {
      this.current.reveal();
      return;
    }
    this.current = ChatWebview.create(context, core, core.logger, () => {
      this.current = null;
    });
  }
}
