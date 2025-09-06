// Renderer (TypeScript port)
// Mirrors the webview's Renderer logic from media/chat/js/04_renderer.js
// and intentionally references DOM globals. This file attaches Renderer to window.

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface SessionRestoreEvent {
  type: 'session.restore';
  messages: ChatMessageItem[];
}

interface AssistantCommitEvent {
  type: 'assistant.commit';
  text: string;
}

interface UserSendEvent {
  type: 'user.send';
  text: string;
}

type RendererEvent = SessionRestoreEvent | AssistantCommitEvent | UserSendEvent;

// Minimal window typings (avoid module conversion)
type ElementsRegistryCtor = new () => {
  register(entry: { key: string; selector: string; controller: any }): void;
  ensureMounted(key: string, doc?: Document): void;
  update(key: string, patch: unknown): void;
  disposeAll(): void;
};
declare const window: any & {
  ElementsRegistry: ElementsRegistryCtor;
  MessageListController: new () => any;
  ComposerController: new (opts: { onSend?: (text: string) => void }) => any;
  CodexBridge?: {
    post: (type: string, payload?: unknown) => void;
    on: (handler: (msg: any) => void) => () => void;
    dispose: () => void;
  };
  _codexRenderer?: any;
};

class Renderer {
  private registry = new window.ElementsRegistry();
  private messages: ChatMessageItem[] = [];

  constructor() {
    this.registry.register({
      key: 'messageList',
      selector: '[data-el="message-list"]',
      controller: new window.MessageListController(),
    });

    // Note: Composer is handled by a dedicated bootstrap (composer-bootstrap.js), so we don't register it here
  }

  mountAll(doc: Document = document) {
    this.registry.ensureMounted('messageList', doc);
    // Note: Composer is handled by a dedicated bootstrap (composer-bootstrap.js), so we don't mount it here
  }

  handle(e: RendererEvent) {
    if (!e || !('type' in e)) return;

    if (e.type === 'session.restore') {
      this.messages = Array.isArray(e.messages) ? e.messages.slice() : [];
      this.registry.update('messageList', { items: this.messages });
      return;
    }

    if (e.type === 'assistant.commit') {
      this.messages.push({ id: randomId(), role: 'assistant', text: e.text });
      this.registry.update('messageList', { items: this.messages });
      return;
    }

    if (e.type === 'user.send') {
      this.messages.push({ id: randomId(), role: 'user', text: e.text });
      this.registry.update('messageList', { items: this.messages });
      return;
    }
  }

  dispose() {
    this.registry.disposeAll();
  }
}

function randomId(): string {
  // crypto.randomUUID is available in webview context; fall back for safety
  const anyCrypto = (globalThis as any).crypto as { randomUUID?: () => string } | undefined;
  return anyCrypto?.randomUUID?.() ?? String(Date.now());
}

// Attach to global for classic script consumption
;(window as any).Renderer = Renderer;
