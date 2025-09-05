// ElementsRegistry: registers, mounts, updates, and disposes controllers
(() => {
  class ElementsRegistry {
    constructor() {
      this.map = new Map();
    }

    register(entry) {
      const { key, selector, controller } = entry;
      if (!key || !selector || !controller) throw new Error('Invalid registry entry');
      if (this.map.has(key)) console.warn('Overwriting registry key', key);
      this.map.set(key, { key, selector, controller, el: null, mounted: false });
    }

    ensureMounted(key, doc = document) {
      const e = this.map.get(key);
      if (!e) throw new Error(`Unknown registry key: ${key}`);
      if (e.mounted && e.el && doc.contains(e.el)) return; // idempotent
      const el = doc.querySelector(e.selector);
      if (!el) {
        console.warn('Element not found for selector', e.selector);
        return;
      }
      try {
        e.controller.mount?.(el);
        e.el = el;
        e.mounted = true;
      } catch (err) {
        console.error('Controller mount error', key, err);
      }
    }

    update(key, patch) {
      const e = this.map.get(key);
      if (!e || !e.mounted) return;
      try { e.controller.update?.(patch); } catch (err) { console.error('Controller update error', key, err); }
    }

    disposeAll() {
      for (const [key, e] of this.map) {
        try { e.controller.dispose?.(); } catch (err) { console.error('Controller dispose error', key, err); }
        e.el = null;
        e.mounted = false;
      }
      this.map.clear();
    }
  }

  window.ElementsRegistry = ElementsRegistry;
})();

