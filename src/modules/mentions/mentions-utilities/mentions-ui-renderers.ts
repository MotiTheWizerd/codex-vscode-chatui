// src/modules/mentions/mentions-utilities/mentions-ui-renderers.ts
// UI rendering functions for FileMentionsController

import { basename, dirname } from "./mentions-helpers";

export type MentionsControllerContext = {
  root: HTMLElement | null;
  input: HTMLElement | null;
  popup: HTMLDivElement | null;
  visible: boolean;
  items: Array<{ path: string; type?: 'file' | 'dir' }>;
  activeIndex: number;
  indexingComplete: boolean;
  MAX_ROWS: number;
  // Add other properties as needed
};

export function renderPopup(ctx: MentionsControllerContext) {
  if (!ctx.popup) return;
  const doc = ctx.popup.ownerDocument;
  ctx.popup.innerHTML = '';
  const rows = ctx.items.slice(0, ctx.MAX_ROWS);
  rows.forEach((entry, i) => {
    const row = doc.createElement('div');
    row.className = 'mentions-row' + (i === ctx.activeIndex ? ' is-active' : '');
    const icon = doc.createElement('span');
    icon.className = 'mentions-icon';
    icon.textContent = entry.type === 'dir' ? '📁' : '📄';
    const name = doc.createElement('span');
    name.className = 'mentions-name';
    const dir = doc.createElement('span');
    dir.className = 'mentions-dir';
    name.textContent = basename(entry.path);
    dir.textContent = dirname(entry.path);
    row.append(icon, name, dir);
    row.addEventListener('mousedown', (ev) => { ev.preventDefault(); });
    // We'll add the click handler in the main controller
    row.addEventListener('mouseenter', () => {
      ctx.activeIndex = i;
      // update highlight without full rebuild
      Array.from(ctx.popup!.querySelectorAll('.mentions-row')).forEach((el, idx) => {
        if (idx === ctx.activeIndex) el.classList.add('is-active');
        else el.classList.remove('is-active');
      });
    });
    ctx.popup!.appendChild(row);
  });
  // Footer hint
  const footer = doc.createElement('div');
  footer.className = 'mentions-footer';
  footer.textContent = ctx.indexingComplete ? '' : 'Indexing…';
  ctx.popup.appendChild(footer);
  // keep active row in view
  const active = ctx.popup.querySelector('.mentions-row.is-active') as HTMLElement | null;
  if (active) active.scrollIntoView({ block: 'nearest' });
}

export function createChip(ctx: MentionsControllerContext, doc: Document, path: string, isDir: boolean = false): HTMLElement {
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
  text.textContent = basename(path);
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