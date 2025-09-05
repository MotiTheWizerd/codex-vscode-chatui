// Tiny bootstrap only: create renderer, mountAll, ui.ready, and forward messages
(function() {
  const bridge = window.CodexBridge;
  const renderer = new window.Renderer();

  function onLoad() {
    renderer.mountAll(document);
    // Announce readiness (schema version included for future-proofing)
    bridge.post('ui.ready', { schemaVersion: 1 });
  }

  window.addEventListener('DOMContentLoaded', onLoad);

  // Forward extension messages to renderer
  bridge.on((msg) => {
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
      // optional: could stream token into a pending assistant bubble later
      // Keeping minimal per the frozen event set
    }
  });

  // Expose for debugging
  window._codexRenderer = renderer;
})();
