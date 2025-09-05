// MessageBridge: single place for postMessage + event listening
(() => {
  const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;

  const listeners = new Set();

  function onMessage(event) {
    const msg = event?.data;
    for (const l of listeners) {
      try { l(msg); } catch (e) { console.error('Message listener error', e); }
    }
  }

  window.addEventListener('message', onMessage);

  const Bridge = {
    post(type, payload) {
      try {
        vscode?.postMessage?.({ type, payload });
        console.debug('[bridge→ext]', type, payload);
      } catch (e) {
        console.error('postMessage failed', e);
      }
    },
    on(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
    dispose() {
      listeners.clear();
      window.removeEventListener('message', onMessage);
    }
  };

  // expose globally
  window.CodexBridge = Bridge;
})();

