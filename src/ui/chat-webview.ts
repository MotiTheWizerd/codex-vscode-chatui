// ui/chat-webview.ts
import * as vscode from "vscode";
import { CoreManager } from "@/core/manager";
import { Logger } from "@/telemetry/logger.js";

export class ChatWebview implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private disposed = false;
  private logger: Logger | null = null;

  private constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly core: CoreManager,
    private readonly onDispose?: () => void
  ) {
    // create the panel
    this.panel = vscode.window.createWebviewPanel(
      "codex.chat",
      "Codex Chat",
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    // listen + cleanup
    const recv = this.panel.webview.onDidReceiveMessage((msg) => {
      this.logger?.info("from webview", msg);
    });
    const cleanup = this.panel.onDidDispose(() => this.dispose());

    this.disposables.push(recv, cleanup);
  }

  private panel: vscode.WebviewPanel;

  /** ✅ static factory, correct placement */
  static create(
    context: vscode.ExtensionContext,
    core: CoreManager,
    logger: Logger | null = null,
    onDispose?: () => void
  ): ChatWebview {
    const instance = new ChatWebview(context, core, onDispose);
    instance.logger = logger;
    return instance;
  }

  reveal(column: vscode.ViewColumn = vscode.ViewColumn.Beside) {
    this.panel.reveal(column);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    try {
      this.onDispose?.();
    } catch {}
    this.panel.dispose();
  }

  get webviewPanel(): vscode.WebviewPanel {
    return this.panel;
  }
}
