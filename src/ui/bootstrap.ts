// Bootstrap (TypeScript) for the webview UI
// Replaces media/chat/js/main.js by orchestrating startup in a typed module.

function whenReady(check: () => boolean, cb: () => void, tries = 50) {
  if (check()) return cb();
  if (tries <= 0) {
    console.error('Codex UI bootstrap failed: globals not ready');
    return;
  }
  setTimeout(() => whenReady(check, cb, tries - 1), 20);
}

function start() {
  const Bridge = (window as any).CodexBridge;
  const RendererCtor = (window as any).Renderer as new () => any;
  if (!Bridge || typeof Bridge.on !== 'function' || typeof Bridge.post !== 'function') {
    console.error('CodexBridge not ready');
    return;
  }
  if (!RendererCtor || typeof RendererCtor !== 'function') {
    console.error('Renderer not ready');
    return;
  }

  const bridge = Bridge;
  const renderer = new RendererCtor();

  function onLoad() {
    try {
      renderer.mountAll(document);
      bridge.post('ui.ready', { schemaVersion: 1 });
    } catch (e) {
      console.error('Codex UI bootstrap onLoad error', e);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    onLoad();
  } else {
    window.addEventListener('DOMContentLoaded', onLoad);
  }

  bridge.on((msg: any) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'init') {
      const messages = (msg.payload && msg.payload.session && Array.isArray(msg.payload.session.messages))
        ? msg.payload.session.messages
        : [];
      renderer.handle({ type: 'session.restore', messages });
    }
    else if (msg.type === 'assistant.commit') {
      renderer.handle({ type: 'assistant.commit', text: msg.text });
    }
    else if (msg.type === 'assistant.token') {
      // optional streaming UI later
    }
  });

  // Expose for debugging
  (window as any)._codexRenderer = renderer;
}

// Wait for bridge + renderer globals set by TS modules
whenReady(() => !!((window as any).CodexBridge && (window as any).Renderer), start);

