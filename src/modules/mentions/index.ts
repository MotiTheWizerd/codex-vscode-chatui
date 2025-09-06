// src/modules/mentions/index.ts
// Stage 1: UI-only @file mentions with deterministic mock data.
// Attaches to a container with [data-mentions] and an editor with [data-composer-input].

type Disposable = { dispose(): void };

export class FileMentionsController implements Disposable {
  private root: HTMLElement | null = null;
  private input: HTMLElement | null = null;
  private popup: HTMLDivElement | null = null;
  private visible = false;
  private items: Array<{ path: string; type?: 'file' | 'dir' }> = [];
  private activeIndex = 0;
  private static readonly MAX_ROWS = 12;
  private bridge: { post: (t: string, p?: any) => void; on?: (h: (m: any) => void) => () => void } | null = null;
  private unsub: (() => void) | null = null;
  private lastReqId: string | null = null;
  private lastDropReqId: string | null = null;
  private debounceTimer: number | null = null;
  private indexingComplete = false;

  // Deterministic mock dataset for Stage 1
  private static MOCK_FILES: string[] = [
    "src/ui/chat-webview.ts",
    "src/ui/renderer.ts",
    "src/ui/controllers.ts",
    "src/ui/elements-registry.ts",
    "src/ui/composer-bootstrap.ts",
    "src/modules/composer/index.ts",
    "src/modules/composer/composer-dom.ts",
    "src/core/manager.ts",
    "src/core/events.ts",
    "media/chat/index.html",
    "media/chat/html/footer/01_footer.html",
    "media/chat/styles/input.css",
  ];

  mount(root: HTMLElement) {
    if (this.root === root) return;
    this.root = root;
    this.input = root.querySelector('[data-composer-input]') as HTMLElement | null;
    if (!this.input) {
      console.warn("FileMentionsController: input not found (data-composer-input)");
      return;
    }

    // Create popup
    this.popup = document.createElement('div');
    this.popup.className = 'mentions-popup hidden';
    this.root.appendChild(this.popup);

    // Events
    this.onKeydown = this.onKeydown.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onClickOutside = this.onClickOutside.bind(this);
    this.onKeyup = this.onKeyup.bind(this);
    this.onMouseup = this.onMouseup.bind(this);
    this.input.addEventListener('keydown', this.onKeydown as EventListener);
    this.input.addEventListener('input', this.onInput as EventListener);
    this.input.addEventListener('keyup', this.onKeyup as EventListener);
    this.input.addEventListener('mouseup', this.onMouseup as EventListener);
    document.addEventListener('click', this.onClickOutside, true);

    // Bridge
    this.bridge = (window as any).CodexBridge ?? null;
    try { console.debug?.('mentions: bridge available =', !!this.bridge); } catch {}
    if (this.bridge?.on) {
      this.unsub = this.bridge.on((msg: any) => this.onBridge(msg));
    }
    // Warm-start: ask for initial index slice
    this.request('files/listChildren', { path: '', limit: 200 });

    // Enable drag & drop from Explorer
    this.installDnD();
  }

  dispose() {
    if (this.input) {
      this.input.removeEventListener('keydown', this.onKeydown as EventListener);
      this.input.removeEventListener('input', this.onInput as EventListener);
      this.input.removeEventListener('keyup', this.onKeyup as EventListener);
      this.input.removeEventListener('mouseup', this.onMouseup as EventListener);
    }
    document.removeEventListener('click', this.onClickOutside, true);
    if (this.windowDragOverHandler) {
      window.removeEventListener('dragover', this.windowDragOverHandler, { capture: true });
      window.removeEventListener('drop', this.windowDropHandler!, { capture: true });
    }
    if (this.popup && this.popup.parentNode) this.popup.parentNode.removeChild(this.popup);
    this.popup = null;
    this.root = null;
    this.input = null;
    try { this.unsub?.(); } catch {}
    this.unsub = null;
  }

  // Public API for collection
  public collectEmbeddedFiles(): string[] {
    if (!this.root) return [];
    return Array.from(this.root.querySelectorAll<HTMLElement>('.mention-chip'))
      .map((el) => el.dataset['path'] || '')
      .filter(Boolean);
  }

  // — Internal helpers —
  private onKeydown(ev: KeyboardEvent) {
    if (!this.input) return;
    // Navigation within popup
    if (this.visible && ["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab"].includes(ev.key)) {
      ev.preventDefault();
      if (ev.key === 'ArrowDown') {
        if (this.items.length > 0) this.activeIndex = (this.activeIndex + 1) % this.items.length;
      }
      if (ev.key === 'ArrowUp') {
        if (this.items.length > 0) this.activeIndex = (this.activeIndex - 1 + this.items.length) % this.items.length;
      }
      if (ev.key === 'Escape') return this.hide();
      if (ev.key === 'Enter' || ev.key === 'Tab') {
        const item = this.items[this.activeIndex];
        if (item) this.insertChip(item.path);
        return;
      }
      this.renderPopup();
      return;
    }

    // Trigger rule: '@' at start or after whitespace
    if (ev.key === '@') {
      const ctxText = this.getBeforeCaretText();
      if (!this.isTriggerContext(ctxText)) return; // Not a trigger context
      this.activeIndex = 0;
      this.show();
      this.scheduleQuery();
      return;
    }

    // Backspace immediately after a chip removes it
    if (ev.key === 'Backspace') {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const r = sel.getRangeAt(0);
      if (r.startContainer.nodeType === Node.TEXT_NODE) {
        const tn = r.startContainer as Text;
        if (r.startOffset === 0) {
          const prev = this.findPrevChip(tn);
          if (prev) {
            ev.preventDefault();
            prev.remove();
            return;
          }
        }
      }
    }
  }

  private onInput() {
    const ctxText = this.getBeforeCaretText();
    if (this.isTriggerContext(ctxText)) {
      if (!this.visible) this.show();
      this.scheduleQuery();
    } else if (this.visible) {
      this.hide();
    }
  }

  private onKeyup(ev: KeyboardEvent) {
    // Ignore navigation/confirm keys to avoid resetting selection
    if (["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(ev.key)) return;
    const ctxText = this.getBeforeCaretText();
    if (this.isTriggerContext(ctxText)) {
      if (!this.visible) this.show();
      this.scheduleQuery();
    }
  }

  private onMouseup() {
    const ctxText = this.getBeforeCaretText();
    if (this.isTriggerContext(ctxText)) {
      if (!this.visible) this.show();
      this.scheduleQuery();
    } else if (this.visible) {
      this.hide();
    }
  }

  private onClickOutside(ev: MouseEvent) {
    const t = ev.target as Node | null;
    if (!this.root || !t) return;
    if (this.root.contains(t)) return; // clicks inside are fine
    this.hide();
  }

  private show() {
    if (!this.popup) return;
    this.visible = true;
    this.popup.classList.remove('hidden');
    this.renderPopup();
  }
  private hide() {
    if (!this.popup) return;
    this.visible = false;
    this.popup.classList.add('hidden');
  }

  private filterItemsLocal() {
    // Fallback local filter (only used if bridge is unavailable)
    const ctxText = this.getBeforeCaretText();
    const q = this.extractQuery(ctxText);
    const base = FileMentionsController.MOCK_FILES;
    let list = q ? base.filter((p) => p.toLowerCase().includes(q)) : base.slice();
    
    // Convert to items with proper type detection
    const items: Array<{ path: string; type: 'file' | 'dir' }> = [];
    const seen = new Set<string>();
    
    // Add files
    for (const path of list) {
      if (!seen.has(path)) {
        items.push({ path, type: 'file' });
        seen.add(path);
      }
    }
    
    // Add parent directories (if not already in the list)
    for (const path of list) {
      const parts = path.split('/').filter(Boolean);
      for (let i = 1; i < parts.length; i++) {
        const dirPath = parts.slice(0, i).join('/');
        if (!seen.has(dirPath)) {
          // If a query exists, only include directories whose basename includes the query
          const dirName = parts[i - 1] || '';
          if (!q || dirName.toLowerCase().includes(q)) {
            items.push({ path: dirPath, type: 'dir' });
          }
          seen.add(dirPath);
        }
      }
    }
    
    // Sort: directories first, then files; alphabetical by name
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return this.basename(a.path).localeCompare(this.basename(b.path));
    });
    
    this.items = items;
    this.activeIndex = 0;
    this.renderPopup();
  }

  private scheduleQuery() {
    if (!this.bridge) {
      try { console.debug?.('mentions: no bridge, using local fallback'); } catch {}
      return this.filterItemsLocal();
    }
    if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => this.queryNow(), 200);
  }

  private queryNow() {
    const ctxText = this.getBeforeCaretText();
    const q = this.extractQuery(ctxText);
    if (!q) {
      try { console.debug?.('mentions: query=listChildren', { path: '' }); } catch {}
      this.request('files/listChildren', { path: '', limit: 200 });
    } else {
      try { console.debug?.('mentions: query=search', { q }); } catch {}
      this.request('files/search', { q, limit: 50 });
    }
  }

  private request(type: 'files/index' | 'files/search' | 'files/listChildren' | 'files/stat', payload: any) {
    if (!this.bridge) return;
    const reqId = `wv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.lastReqId = reqId;
    this.bridge.post(type, { ...(payload || {}), reqId });
  }

  private requestDrop(items: string[]) {
    if (!this.bridge) return;
    const reqId = `drop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.lastDropReqId = reqId;
    this.bridge.post('files/resolveDrop', { items, reqId });
  }

  private onBridge(msg: any) {
    if (!msg || msg.type !== 'files/result') return;
    const op = msg.op as string | undefined;
    if (op === 'resolveDrop') {
      if (this.lastDropReqId && msg.reqId && msg.reqId !== this.lastDropReqId) return;
      const items = Array.isArray(msg.items) ? msg.items as Array<{ path: string }> : [];
      const toAdd = items.map((i) => i.path).filter(Boolean);
      if (toAdd.length) this.insertChips(toAdd);
      return;
    }
    if (this.lastReqId && msg.reqId && msg.reqId !== this.lastReqId) return; // stale
    const items = Array.isArray(msg.items) ? msg.items as Array<{ path: string; type?: 'file' | 'dir' }> : [];
    const next = items.filter((it) => !!it && !!it.path);
    // Defensive sort to ensure folders first even if provider forgets
    next.sort((a, b) => {
      const at = (a.type ?? 'file');
      const bt = (b.type ?? 'file');
      if (at !== bt) return at === 'dir' ? -1 : 1;
      const an = this.basename(a.path);
      const bn = this.basename(b.path);
      return an.localeCompare(bn);
    });
    try {
      const dirCount = next.filter((x) => (x.type ?? 'file') === 'dir').length;
      console.debug?.('mentions: bridge result', { count: next.length, dirs: dirCount, op });
    } catch {}
    // Preserve selection if possible
    const prevActive = this.activeIndex;
    this.items = next;
    this.indexingComplete = !!msg.meta?.complete;
    if (this.items.length === 0) this.activeIndex = 0;
    else this.activeIndex = Math.min(prevActive, this.items.length - 1);
    this.renderPopup();
  }

  private renderPopup() {
    if (!this.popup) return;
    const doc = this.popup.ownerDocument;
    this.popup.innerHTML = '';
    const rows = this.items.slice(0, FileMentionsController.MAX_ROWS);
    rows.forEach((entry, i) => {
      const row = doc.createElement('div');
      row.className = 'mentions-row' + (i === this.activeIndex ? ' is-active' : '');
      const icon = doc.createElement('span');
      icon.className = 'mentions-icon';
      icon.textContent = entry.type === 'dir' ? '📁' : '📄';
      const name = doc.createElement('span');
      name.className = 'mentions-name';
      const dir = doc.createElement('span');
      dir.className = 'mentions-dir';
      name.textContent = this.basename(entry.path);
      dir.textContent = this.dirname(entry.path);
      row.append(icon, name, dir);
      row.addEventListener('mousedown', (ev) => { ev.preventDefault(); });
      row.addEventListener('click', () => this.insertChip(entry.path));
      row.addEventListener('mouseenter', () => {
        this.activeIndex = i;
        // update highlight without full rebuild
        Array.from(this.popup!.querySelectorAll('.mentions-row')).forEach((el, idx) => {
          if (idx === this.activeIndex) el.classList.add('is-active');
          else el.classList.remove('is-active');
        });
      });
      this.popup!.appendChild(row);
    });
    // Footer hint
    const footer = doc.createElement('div');
    footer.className = 'mentions-footer';
    footer.textContent = this.indexingComplete ? '' : 'Indexing…';
    this.popup.appendChild(footer);
    // keep active row in view
    const active = this.popup.querySelector('.mentions-row.is-active') as HTMLElement | null;
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  private insertChip(path: string) {
    if (!this.input) return;
    const sel = this.input.ownerDocument.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // Determine type for icon (fallback to file)
    const cur = this.items.find((it) => it.path === path);
    const isDir = cur?.type === 'dir';
    // Build chip and trailing space
    const chip = this.createChip(this.input.ownerDocument, path, isDir);
    // Insert chip at caret
    range.insertNode(chip);
    // Remove the original @mention token immediately before the chip
    this.removeAtTokenBeforeNode(chip);
    // Insert two trailing spaces and move caret after them
    const space1 = this.input.ownerDocument.createTextNode(' ');
    const space2 = this.input.ownerDocument.createTextNode(' ');
    const afterChip = this.input.ownerDocument.createRange();
    afterChip.setStartAfter(chip);
    afterChip.collapse(true);
    afterChip.insertNode(space1);
    const afterSpace1 = this.input.ownerDocument.createRange();
    afterSpace1.setStartAfter(space1);
    afterSpace1.collapse(true);
    afterSpace1.insertNode(space2);
    sel.collapse(space2, 1);
    this.hide();
  }

  private insertChips(paths: string[]) {
    if (!this.input) return;
    const existing = new Set(
      Array.from((this.root || this.input).querySelectorAll<HTMLElement>('.mention-chip'))
        .map((el) => el.dataset['path'])
        .filter(Boolean) as string[]
    );
    const list = paths.filter((p) => p && !existing.has(p));
    for (const p of list) this.insertChip(p);
  }

  private installDnD() {
    if (!this.input) return;
    const container = this.root || this.input;

    const isSupported = (dt: DataTransfer | null): boolean => {
      if (!dt) return false;
      const types = Array.from(dt.types || []);
      return types.includes('text/uri-list') || types.includes('text/plain');
    };

    const handleDragOver = (e: DragEvent) => {
      const dt = e.dataTransfer;
      if (!dt) return;
      // Always prevent default to avoid browser navigation
      e.preventDefault();
      e.stopPropagation();
      if (isSupported(dt)) {
        try { dt.dropEffect = 'copy'; } catch {}
        container.classList.add('drop-target');
      }
    };

    const handleDragEnter = (e: DragEvent) => {
      e.stopPropagation();
      container.classList.add('drop-target');
    };

    const handleDragLeave = (e: DragEvent) => {
      e.stopPropagation();
      container.classList.remove('drop-target');
    };

    const handleDrop = (e: DragEvent) => {
      const dt = e.dataTransfer;
      container.classList.remove('drop-target');
      if (!dt) return;
      if (!isSupported(dt)) return;
      const inputs: string[] = [];
      const uriList = dt.getData('text/uri-list');
      if (uriList) inputs.push(...uriList.split(/\r?\n/).filter(Boolean));
      else {
        const plain = dt.getData('text/plain');
        if (plain) inputs.push(plain);
      }
      if (inputs.length) {
        e.preventDefault();
        e.stopPropagation();
        this.requestDrop(inputs);
      }
    };

    // Attach to both input and container to catch drops on padding/margins
    const targets: HTMLElement[] = [];
    targets.push(this.input);
    if (container !== this.input) targets.push(container);
    for (const t of targets) {
      t.addEventListener('dragover', handleDragOver, { capture: true });
      t.addEventListener('dragenter', handleDragEnter, { capture: true });
      t.addEventListener('dragleave', handleDragLeave, { capture: true });
      t.addEventListener('drop', handleDrop, { capture: true });
    }

    // Window and document-level suppression to avoid VS Code default open on drop
    const windowDragOver = (e: DragEvent) => {
      // Unconditionally suppress VS Code default handling so drop doesn't open files/folders
      e.preventDefault();
      e.stopPropagation();
    };
    const windowDrop = (e: DragEvent) => {
      // Unconditionally suppress VS Code default handling
      e.preventDefault();
      e.stopPropagation();
    };
    const docDragOver = (e: DragEvent) => {
      // Unconditionally suppress VS Code default handling so drop doesn't open files/folders
      e.preventDefault();
      e.stopPropagation();
    };
    const docDrop = (e: DragEvent) => {
      // Unconditionally suppress VS Code default handling
      e.preventDefault();
      e.stopPropagation();
    };
    // Use passive: false to ensure we can call preventDefault()
    window.addEventListener('dragover', windowDragOver, { capture: true, passive: false });
    window.addEventListener('drop', windowDrop, { capture: true, passive: false });
    document.addEventListener('dragover', docDragOver, { capture: true, passive: false });
    document.addEventListener('drop', docDrop, { capture: true, passive: false });

    // Store references so we can remove them later
    this.windowDragOverHandler = windowDragOver;
    this.windowDropHandler = windowDrop;
  }

  // Store references to window event handlers so we can remove them in dispose
  private windowDragOverHandler: ((e: DragEvent) => void) | null = null;
  private windowDropHandler: ((e: DragEvent) => void) | null = null;

  private createChip(doc: Document, path: string, isDir: boolean = false): HTMLElement {
    const el = doc.createElement('span');
    el.className = 'mention-chip';
    el.setAttribute('data-path', path);
    // Prevent caret from entering the chip
    el.setAttribute('contenteditable', 'false');

    const icon = doc.createElement('span');
    icon.className = 'mention-chip-icon';
    icon.textContent = isDir ? '📁' : '📄';
    const text = doc.createElement('span');
    text.className = 'mention-chip-text';
    text.textContent = this.basename(path);
    const close = doc.createElement('button');
    close.className = 'mention-chip-close';
    close.type = 'button';
    close.textContent = '×';
    close.addEventListener('click', (ev) => {
      ev.preventDefault();
      el.remove();
    });
    el.append(icon, text, close);
    return el;
  }

  private getBeforeCaretText(): string {
    if (!this.input) return '';
    const sel = this.input.ownerDocument.getSelection();
    if (!sel || sel.rangeCount === 0) return '';
    const r = sel.getRangeAt(0).cloneRange();
    r.setStart(this.input, 0);
    return r.toString();
  }

  // True when context near caret matches an @-mention token.
  // Accepts:
  //  - start-of-line or whitespace + '@' + optional non-space query at the caret end
  //  - also considers the case of '@ ' (space after @) to show top items
  private isTriggerContext(ctx: string): boolean {
    if (!ctx) return false;
    if ((/(^|\s)@\S*$/).test(ctx)) return true; // '@foo' style
    if ((/(^|\s)@\s$/).test(ctx)) return true; // '@ ' style
    return false;
  }

  // Extract the current query (text after '@' up to caret), empty string for '@ ' cases
  private extractQuery(ctx: string): string {
    const m = ctx.match(/(^|\s)@(\S*)$/);
    if (m) return (m[2] || '').toLowerCase();
    return '';
  }

  private findPrevChip(node: Node): HTMLElement | null {
    let cur: Node | null = node;
    while (cur && cur !== this.input) {
      const prev = cur.previousSibling;
      if (prev && prev instanceof HTMLElement && prev.classList.contains('mention-chip')) return prev;
      cur = cur.parentNode;
    }
    return null;
  }

  // Remove the @mention token (e.g., "@foo") immediately before the given node
  private removeAtTokenBeforeNode(node: Node) {
    if (!this.input) return;
    const doc = this.input.ownerDocument;
    const walker = doc.createTreeWalker(this.input, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    let n: Node | null = walker.currentNode;
    while ((n = walker.nextNode())) {
      texts.push(n as Text);
    }
    // Find last text node before the reference node
    let idx = -1;
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i]!;
      const pos = t.compareDocumentPosition(node);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) idx = i; // t is before node
    }
    if (idx < 0) return;
    // Scan backwards to find '@' start satisfying (start|whitespace) before '@'
    let startNode: Text | null = null;
    let startOffset = 0;
    let found = false;
    let curIndex = idx;
    let offset = texts[curIndex]!.data.length;
    let prevChar: string | null = null;
    while (curIndex >= 0) {
      const t = texts[curIndex]!;
      const data = t.data;
      while (offset > 0) {
        const ch = data.charAt(offset - 1);
        if (ch === '@') {
          // Determine char before '@'
          let before: string | null = null;
          if (offset - 2 >= 0) before = data.charAt(offset - 2);
          else if (curIndex - 1 >= 0) {
            const prevT = texts[curIndex - 1];
            if (prevT) {
              const pd = prevT.data;
              before = pd.length ? pd.charAt(pd.length - 1) : null;
            }
          }
          if (!before || /\s/.test(before)) {
            startNode = t;
            startOffset = offset - 1;
            found = true;
          }
          break;
        }
        // Stop if we encounter whitespace after having seen non-space prevChar (indicates token boundary) — but we only care about '@'
        prevChar = ch;
        offset--;
      }
      if (found) break;
      curIndex--;
      if (curIndex >= 0) offset = texts[curIndex]!.data.length;
    }
    if (!found || !startNode) return;
    const del = doc.createRange();
    del.setStart(startNode, startOffset);
    del.setEndBefore(node);
    del.deleteContents();
  }

  private basename(p: string): string {
    if (!p) return p;
    const parts = p.split('/').filter(Boolean);
    if (!parts.length) return p;
    return parts[parts.length - 1] ?? p;
  }

  private dirname(p: string): string {
    if (!p) return '';
    const parts = p.split('/').filter(Boolean);
    if (parts.length <= 1) return '';
    return parts.slice(0, parts.length - 1).join('/');
  }
}
