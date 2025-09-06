// src/modules/mentions/mentions-utilities/mentions-ui.ts
// UI rendering logic for FileMentionsController

import { FileMentionsCore } from "@/modules/mentions/mentions-utilities/mentions-core";

export class FileMentionsUI extends FileMentionsCore {
  protected renderPopup() {
    if (!this.popup) return;
    const doc = this.popup.ownerDocument;
    this.popup.innerHTML = '';
    const rows = this.items.slice(0, FileMentionsCore.MAX_ROWS);
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

  // Placeholder; implemented in the Bridge layer
  protected scheduleQuery(): void {
    // no-op in UI layer
  }

  // Placeholder; implemented in Utils layer
  protected insertChips(_paths: string[]): void {
    // no-op in UI layer
  }

  protected createChip(doc: Document, path: string, isDir: boolean = false): HTMLElement {
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

  protected basename(p: string): string {
    if (!p) return p;
    const parts = p.split('/').filter(Boolean);
    if (!parts.length) return p;
    return parts[parts.length - 1] ?? p;
  }

  protected dirname(p: string): string {
    if (!p) return '';
    const parts = p.split('/').filter(Boolean);
    if (parts.length <= 1) return '';
    return parts.slice(0, parts.length - 1).join('/');
  }

  protected insertChip(path: string) {
    // Implementation in mentions-utils.ts
  }
}
