// src/modules/mentions/mentions-utilities/mentions-bridge.ts
// Bridge communication logic for FileMentionsController

import { FileMentionsEvents } from "@/modules/mentions/mentions-utilities/mentions-events";
import { FileMentionsCore } from "@/modules/mentions/mentions-utilities/mentions-core";

export class FileMentionsBridge extends FileMentionsEvents {
  protected filterItemsLocal() {
    // Fallback local filter (only used if bridge is unavailable)
    const ctxText = this.getBeforeCaretText();
    const q = this.extractQuery(ctxText);
    const base = FileMentionsCore.MOCK_FILES;
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

  protected override scheduleQuery() {
    if (!this.bridge) {
      try { console.debug?.('mentions: no bridge, using local fallback'); } catch {}
      return this.filterItemsLocal();
    }
    if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => this.queryNow(), 200);
  }

  protected queryNow() {
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

  protected request(type: 'files/index' | 'files/search' | 'files/listChildren' | 'files/stat', payload: any) {
    if (!this.bridge) return;
    const reqId = `wv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.lastReqId = reqId;
    this.bridge.post(type, { ...(payload || {}), reqId });
  }

  protected requestDrop(items: string[]) {
    if (!this.bridge) return;
    const reqId = `drop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.lastDropReqId = reqId;
    this.bridge.post('files/resolveDrop', { items, reqId });
  }

  protected onBridge(msg: any) {
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
}
