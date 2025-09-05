// src/ui/composer-bootstrap.ts
// Bootstrap for the React composer module

import { initComposer } from "../modules/composer/index.js";

// Use the global bridge injected by dist/ui/bridge.js to talk to extension

function whenReady(check: () => boolean, cb: () => void, tries = 50) {
  if (check()) return cb();
  if (tries <= 0) {
    console.error('Codex Composer bootstrap failed: globals not ready');
    return;
  }
  setTimeout(() => whenReady(check, cb, tries - 1), 20);
}

function start() {
  const post = (type: string, payload?: any) => {
    try { (window as any).CodexBridge?.post(type, payload); } catch {}
  };

  const root = document.getElementById('composer-root');
  if (root) {
    const composer = initComposer(root, { 
      placeholder: "Ask anything (Ctrl+I)",
      slashCommands: [] // Add slash commands here if needed
    });
    
    const send = (html: string, attachments?: any[]) => {
      const t = (html ?? '').replace(/<[^>]*>/g, '').trim();
      if (!t && !(attachments && attachments.length)) return;
      post('chat.userMessage', { text: html, attachments: attachments ?? composer.getAttachments?.() });
      composer.setValue('');
      composer.clearAttachments?.();
    };

    // Support Ctrl+Enter from composer and keep button state in sync
    composer.on((e) => {
      if (e.type === 'submit') send(e.value, e.attachments);
      if (e.type === 'change') {
        const btn = document.getElementById('sendButton') as HTMLButtonElement | null;
        if (btn) {
          const html = String(e.value ?? '');
          const text = html.replace(/<[^>]*>/g, '').trim();
          const attachments = (e as any).attachments as any[] | undefined;
          btn.disabled = !text && !(attachments && attachments.length);
        }
      }
    });

    // Wire the existing Send button in footer
    const sendBtn = document.getElementById('sendButton') as HTMLButtonElement | null;
    if (sendBtn) {
      sendBtn.addEventListener('click', () => send(composer.getValue(), composer.getAttachments?.()));
      // Initialize disabled state
      const initText = (composer.getValue() ?? '').replace(/<[^>]*>/g, '').trim();
      const initAt = (composer.getAttachments?.() || []).length;
      sendBtn.disabled = !initText && !initAt;
    }

    // Handle focus requests from the extension
    window.addEventListener("message", (ev) => {
      const msg = ev.data;
      if (!msg) return;
      if (msg.type === "ui.focusInput") composer.focus();
      if (msg.type === "ui.setInput") composer.setValue(msg.text ?? "");
      if (msg.type === "ui.insertText") composer.setValue(composer.getValue() + (msg.text ?? ""));
    });

    // Expose for debugging
    (window as any)._codexComposer = composer;
  }
}

// Wait for DOM to be ready
whenReady(() => document.readyState === 'complete' || document.readyState === 'interactive', start);
