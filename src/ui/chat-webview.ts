// ui/chat-webview.ts
import * as vscode from "vscode";
import { CoreManager } from "@/core/manager";
import type { Logger } from "@/telemetry/logger.js";
import { Events } from "@core/events";
import { buildChatHtml } from "@/ui/chat-webview-utilities/html-builder";
import { escapeHtml } from "@/ui/chat-webview-utilities/fragment-utils";
import { createMessageHandler } from "@/ui/chat-webview-utilities/message-router";
import { attachTransportBridge } from "@/ui/chat-webview-utilities/transport-bridge";

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
      "codexq.chat",
      "Codex Q Chat",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "media"),
          vscode.Uri.joinPath(context.extensionUri, "dist"),
        ],
      }
    );

    // listen + cleanup via extracted handler
    const handler = createMessageHandler(this.core, this.panel, this.logger);
    const recv = this.panel.webview.onDidReceiveMessage(handler);
    const cleanup = this.panel.onDidDispose(() => this.dispose());

    this.disposables.push(recv, cleanup);

    // Subscribe to transport events via bridge utility
    const bridgeDisposable = attachTransportBridge(
      this.core.eventBusInstance,
      this.panel,
      this.core,
      this.logger
    );
    this.disposables.push(bridgeDisposable);

    // initial HTML
    void this.setHtml(context);

    // optional: watch for changes in media/chat and auto-refresh
    const assetPattern = new vscode.RelativePattern(
      vscode.Uri.joinPath(context.extensionUri, "media", "chat"),
      "**/*.{css,js}"
    );
    const htmlPattern = new vscode.RelativePattern(
      vscode.Uri.joinPath(context.extensionUri, "media", "chat", "html"),
      "**/*.html"
    );
    const watcherAssets =
      vscode.workspace.createFileSystemWatcher(assetPattern);
    const watcherHtml = vscode.workspace.createFileSystemWatcher(htmlPattern);
    let refreshTimer: NodeJS.Timeout | undefined;
    const refresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void this.setHtml(context), 150);
    };
    watcherAssets.onDidCreate(refresh);
    watcherAssets.onDidChange(refresh);
    watcherAssets.onDidDelete(refresh);
    watcherHtml.onDidCreate(refresh);
    watcherHtml.onDidChange(refresh);
    watcherHtml.onDidDelete(refresh);
    this.disposables.push(watcherAssets, watcherHtml, {
      dispose: () => refreshTimer && clearTimeout(refreshTimer),
    });
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

  private async setHtml(context: vscode.ExtensionContext) {
    const webview = this.panel.webview;
    try {
      const html = await buildChatHtml(context, webview, this.logger);
      webview.html = html;
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      this.logger?.error?.("Failed to set chat HTML", { error: m });
      webview.html = `<!DOCTYPE html><html><body><pre>Failed to load chat UI: ${escapeHtml(m)}</pre></body></html>`;
    }
  }
}
 
