// MessageBridge (TypeScript port)
// Mirrors the webview bridge from media/chat/js/01_bridge.js in typed form.

interface BridgeMessage<T = any> {
  type: string;
  payload?: T;
  // Allow extra fields for forward-compat (e.g., text)
  [key: string]: any;
}

type BridgeHandler = (msg: BridgeMessage | undefined) => void;

interface VsCodeApiLike {
  postMessage: (message: unknown) => void;
  setState?: (state: unknown) => void;
  getState?: () => unknown;
}

function getVsCodeApi(): VsCodeApiLike | undefined {
  try {
    const anyGlobal = globalThis as any;
    if (typeof anyGlobal.acquireVsCodeApi === 'function') {
      return anyGlobal.acquireVsCodeApi();
    }
  } catch {
    // ignore
  }
  return undefined;
}

class MessageBridge {
  private vscode: VsCodeApiLike | undefined;
  private listeners = new Set<BridgeHandler>();
  private boundOnMessage: (event: MessageEvent) => void;

  constructor() {
    this.vscode = getVsCodeApi();
    this.boundOnMessage = (event: MessageEvent) => {
      const msg = (event?.data ?? undefined) as BridgeMessage | undefined;
      for (const l of this.listeners) {
        try {
          l(msg);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Message listener error', e);
        }
      }
    };
    window.addEventListener('message', this.boundOnMessage);
  }

  post<T = any>(type: string, payload?: T) {
    try {
      this.vscode?.postMessage?.({ type, payload });
      // eslint-disable-next-line no-console
      console.debug('[bridge→ext]', type, payload);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('postMessage failed', e);
    }
  }

  on(handler: BridgeHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  dispose() {
    this.listeners.clear();
    window.removeEventListener('message', this.boundOnMessage);
  }
}

// Attach a global bridge for the webview runtime
;(function attachGlobal() {
  const bridge = new MessageBridge();
  (window as any).CodexBridge = bridge;
})();
