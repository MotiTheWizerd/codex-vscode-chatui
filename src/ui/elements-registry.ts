// ElementsRegistry (TypeScript port)
// Mirrors media/chat/js/02_registry.js and attaches to window.

type Controller = {
  mount?: (root: HTMLElement) => void;
  update?: (patch: unknown) => void;
  dispose?: () => void;
};

type Entry = {
  key: string;
  selector: string;
  controller: Controller;
  el?: HTMLElement | null;
  mounted?: boolean;
};

class ElementsRegistry {
  private map = new Map<string, Entry>();

  register(entry: { key: string; selector: string; controller: Controller }) {
    const { key, selector, controller } = entry;
    if (!key || !selector || !controller) throw new Error('Invalid registry entry');
    if (this.map.has(key)) console.warn('Overwriting registry key', key);
    this.map.set(key, { key, selector, controller, el: null, mounted: false });
  }

  ensureMounted(key: string, doc: Document = document) {
    const e = this.map.get(key);
    if (!e) throw new Error(`Unknown registry key: ${key}`);
    if (e.mounted && e.el && doc.contains(e.el)) return; // idempotent
    const el = doc.querySelector(e.selector) as HTMLElement | null;
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

  update(key: string, patch: unknown) {
    const e = this.map.get(key);
    if (!e || !e.mounted) return;
    try {
      e.controller.update?.(patch);
    } catch (err) {
      console.error('Controller update error', key, err);
    }
  }

  disposeAll() {
    for (const [key, e] of this.map) {
      try {
        e.controller.dispose?.();
      } catch (err) {
        console.error('Controller dispose error', key, err);
      }
      e.el = null;
      e.mounted = false;
    }
    this.map.clear();
  }
}

// Attach to window for classic script usage
;(window as any).ElementsRegistry = ElementsRegistry;

