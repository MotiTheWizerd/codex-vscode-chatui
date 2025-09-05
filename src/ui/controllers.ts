// Controllers (TypeScript port)
// Mirrors media/chat/js/03_controllers.js and attaches to window.
import { sanitizeHtml } from "@/modules/composer/sanitize.js";

class MessageListController {
  private root: HTMLElement | null = null;
  private items: Array<{ id?: string; role: 'user' | 'assistant'; text: string }> = [];

  mount(root: HTMLElement) {
    if (this.root === root) return; // idempotent
    this.root = root;
    this.render();
  }

  update(patch: any) {
    if (!this.root) return;
    if (patch && Array.isArray(patch.items)) this.items = patch.items;
    this.render();
  }

  private render() {
    if (!this.root) return;
    const html = this.items.map(m => {
      const safe = sanitizeHtml(String(m.text ?? ""));
      return `
      <div class="message">
        <div class="message-header">
          <div class="message-avatar ${m.role === 'user' ? 'user-avatar' : 'assistant-avatar'}">${m.role === 'user' ? 'U' : 'AI'}</div>
          <div class="message-time">now</div>
        </div>
        <div class="message-content">${safe}</div>
      </div>
    `;}).join('\n');
    this.root.innerHTML = html;
    this.root.scrollTop = this.root.scrollHeight;
  }

  dispose() {
    this.root = null;
    this.items = [];
  }
}

class ComposerController {
  private root: HTMLElement | null = null;
  private input: HTMLTextAreaElement | HTMLInputElement | null = null;
  private sendBtn: HTMLButtonElement | null = null;
  private opts: { onSend?: (text: string) => void };

  constructor(opts?: { onSend?: (text: string) => void }) {
    this.opts = opts || {};
    this._onKey = this._onKey.bind(this);
    this._onInput = this._onInput.bind(this);
    this._onClickSend = this._onClickSend.bind(this);
  }

  mount(root: HTMLElement) {
    if (this.root === root) return; // idempotent
    this.root = root;
    this.input = root.querySelector('[data-role="input"], #messageInput') as any;
    this.sendBtn = root.querySelector('[data-action="send"], #sendButton') as any;

    if (this.input) {
      this.input.addEventListener('keydown', this._onKey as unknown as EventListener);
      this.input.addEventListener('input', this._onInput as unknown as EventListener);
    }
    if (this.sendBtn) this.sendBtn.addEventListener('click', this._onClickSend);
    this._syncDisabled();
  }

  private _onKey(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      this._send();
    }
  }

  private _onInput() {
    if (!this.input) return;
    (this.input as any).style.height = 'auto';
    (this.input as any).style.height = Math.min((this.input as any).scrollHeight, 120) + 'px';
    this._syncDisabled();
  }

  private _onClickSend() {
    this._send();
  }

  private _syncDisabled() {
    if (!this.sendBtn || !this.input) return;
    const has = !!(this.input as any).value?.trim();
    this.sendBtn.disabled = !has;
  }

  private _send() {
    if (!this.input) return;
    const text = String((this.input as any).value ?? '').trim();
    if (!text) return;
    try { this.opts.onSend?.(text); } catch (e) { console.error('onSend error', e); }
    (this.input as any).value = '';
    (this.input as any).style.height = 'auto';
    this._syncDisabled();
  }

  update(_patch: any) {}

  dispose() {
    if (this.input) {
      (this.input as any).removeEventListener('keydown', this._onKey as unknown as EventListener);
      (this.input as any).removeEventListener('input', this._onInput as unknown as EventListener);
    }
    if (this.sendBtn) this.sendBtn.removeEventListener('click', this._onClickSend);
    this.root = null;
    this.input = null;
    this.sendBtn = null;
  }
}

// Attach to window for classic script usage
;(window as any).MessageListController = MessageListController;
;(window as any).ComposerController = ComposerController;
