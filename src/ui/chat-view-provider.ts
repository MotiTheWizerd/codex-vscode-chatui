// ui/chat-view-provider.ts
import * as vscode from "vscode";
import { CoreManager } from "@/core/manager";
import { Logger } from "@/telemetry/logger.js";

type IpcMessage = {
  type: string;
  requestId?: string;
  payload?: unknown;
  error?: string;
};

export class ChatViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = "codex.chatView";

  private view: vscode.WebviewView | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly core: CoreManager,
    private readonly logger: Logger | null
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    const recv = webviewView.webview.onDidReceiveMessage(async (msg: IpcMessage) => {
      this.logger?.info("chat:view:recv", msg);
      // TODO: route messages to core/event bus if needed
      switch (msg.type) {
        case "ready":
          // Auto-open the main Chat Panel when the launcher view becomes ready
          try {
            await vscode.commands.executeCommand("codex.openChatPanel");
          } catch (e) {
            const m = e instanceof Error ? e.message : String(e);
            this.logger?.error?.("Failed to open chat panel", { error: m });
          }
          this.post({ type: "hello", payload: { version: 1 } });
          break;
        case "openPanel":
          try {
            await vscode.commands.executeCommand("codex.openChatPanel");
          } catch (e) {
            const m = e instanceof Error ? e.message : String(e);
            this.logger?.error?.("Failed to open chat panel", { error: m });
          }
          break;
        default:
          this.logger?.debug?.("unhandled message", { type: msg.type });
      }
    });

    webviewView.onDidDispose(() => {
      recv.dispose();
      this.view = null;
    });
  }

  reveal(): void {
    // View reveal is handled by VS Code via container reveal command.
  }

  post(message: IpcMessage): void {
    this.view?.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const csp = [
      `default-src 'none'` ,
      `img-src ${webview.cspSource} blob:` ,
      `style-src ${webview.cspSource} 'unsafe-inline'` ,
      `script-src 'nonce-${nonce}'` ,
      `font-src ${webview.cspSource}` ,
      `connect-src ${webview.cspSource}`
    ].join('; ');

    const styles = `
      :root {
        color-scheme: light dark;
      }
      html, body { height:100%; padding:0; margin:0; }
      body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); }
      .wrap { display:flex; flex-direction:column; height:100%; }
      header { padding: 6px 10px; border-bottom: 1px solid var(--vscode-panel-border); display:flex; align-items:center; justify-content:space-between; }
      header .title { font-weight: 600; }
      main { flex:1; overflow:auto; padding: 10px; }
      footer { border-top: 1px solid var(--vscode-panel-border); padding:8px; display:flex; gap:8px; }
      input[type="text"] { flex:1; padding:6px 8px; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); color: var(--vscode-input-foreground); }
      button { padding:6px 10px; }
      .empty { opacity: 0.7; }
    `;

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Codex Chat</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="wrap" role="main" aria-label="Codex Chat Launcher">
          <header>
            <span class="title">Codex Chat</span>
          </header>
          <main id="messages">
            <div class="empty">Opening Codex Chat panel… If it doesn’t open, click the button below.</div>
          </main>
          <footer>
            <button id="open">Open Chat Panel</button>
          </footer>
        </div>
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          const openBtn = document.getElementById('open');
          function post(type, payload) { vscode.postMessage({ type, payload }); }
          openBtn.addEventListener('click', () => post('openPanel'));
          // signal ready (auto-opens panel from extension side)
          post('ready', {});
        </script>
      </body>
      </html>`;
  }
}

function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
