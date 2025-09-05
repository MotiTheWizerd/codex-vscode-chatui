// MessageListController and ComposerController
(() => {
  class MessageListController {
    constructor() {
      this.root = null;
      this.items = [];
    }

    mount(root) {
      if (this.root === root) return; // idempotent
      this.root = root;
      this.render();
    }

    update(patch) {
      if (!this.root) return;
      if (patch && Array.isArray(patch.items)) this.items = patch.items;
      this.render();
    }

    render() {
      if (!this.root) return;
      const escape = (s) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      const html = this.items.map(m => `
        <div class="message">
          <div class="message-header">
            <div class="message-avatar ${m.role === 'user' ? 'user-avatar' : 'assistant-avatar'}">${m.role === 'user' ? 'U' : 'AI'}</div>
            <div class="message-time">now</div>
          </div>
          <div class="message-content">${escape(m.text)}</div>
        </div>
      `).join('\n');
      this.root.innerHTML = html;
      this.root.scrollTop = this.root.scrollHeight;
    }

    dispose() {
      this.root = null;
      this.items = [];
    }
  }

  class ComposerController {
    constructor(opts) {
      this.opts = opts || {};
      this.root = null;
      this.input = null;
      this.sendBtn = null;
      this._onKey = this._onKey.bind(this);
      this._onInput = this._onInput.bind(this);
      this._onClickSend = this._onClickSend.bind(this);
    }

    mount(root) {
      if (this.root === root) return; // idempotent
      this.root = root;
      this.input = root.querySelector('[data-role="input"], #messageInput');
      this.sendBtn = root.querySelector('[data-action="send"], #sendButton');

      if (this.input) {
        this.input.addEventListener('keydown', this._onKey);
        this.input.addEventListener('input', this._onInput);
      }
      if (this.sendBtn) this.sendBtn.addEventListener('click', this._onClickSend);
      this._syncDisabled();
    }

    _onKey(e) {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this._send();
      }
    }

    _onInput() {
      if (!this.input) return;
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
      this._syncDisabled();
    }

    _onClickSend() {
      this._send();
    }

    _syncDisabled() {
      if (!this.sendBtn || !this.input) return;
      const has = !!this.input.value.trim();
      this.sendBtn.disabled = !has;
    }

    _send() {
      if (!this.input) return;
      const text = this.input.value.trim();
      if (!text) return;
      try { this.opts.onSend?.(text); } catch (e) { console.error('onSend error', e); }
      this.input.value = '';
      this.input.style.height = 'auto';
      this._syncDisabled();
    }

    update() {}

    dispose() {
      if (this.input) {
        this.input.removeEventListener('keydown', this._onKey);
        this.input.removeEventListener('input', this._onInput);
      }
      if (this.sendBtn) this.sendBtn.removeEventListener('click', this._onClickSend);
      this.root = null;
      this.input = null;
      this.sendBtn = null;
    }
  }

  window.MessageListController = MessageListController;
  window.ComposerController = ComposerController;
})();

