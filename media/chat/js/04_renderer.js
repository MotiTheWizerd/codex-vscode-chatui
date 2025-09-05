// Renderer: single place to register and route events
(() => {
  class Renderer {
    constructor() {
      this.registry = new window.ElementsRegistry();
      this.messages = [];

      // SINGLE place of truth for initial UI elements
      this.registry.register({
        key: 'messageList',
        selector: '[data-el="message-list"]',
        controller: new window.MessageListController(),
      });
      this.registry.register({
        key: 'composer',
        selector: '[data-el="composer"]',
        controller: new window.ComposerController({
          onSend: (text) => this.handle({ type: 'user.send', text }),
        }),
      });
    }

    mountAll(doc = document) {
      this.registry.ensureMounted('messageList', doc);
      this.registry.ensureMounted('composer', doc);
    }

    handle(e) {
      if (!e || !e.type) return;
      if (e.type === 'session.restore') {
        this.messages = Array.isArray(e.messages) ? e.messages.slice() : [];
        this.registry.update('messageList', { items: this.messages });
      } else if (e.type === 'assistant.commit') {
        this.messages.push({ id: crypto.randomUUID?.() || String(Date.now()), role: 'assistant', text: e.text });
        this.registry.update('messageList', { items: this.messages });
      } else if (e.type === 'user.send') {
        this.messages.push({ id: crypto.randomUUID?.() || String(Date.now()), role: 'user', text: e.text });
        this.registry.update('messageList', { items: this.messages });
        window.CodexBridge?.post('chat.userMessage', { text: e.text });
      }
    }

    dispose() {
      this.registry.disposeAll();
    }
  }

  window.Renderer = Renderer;
})();

