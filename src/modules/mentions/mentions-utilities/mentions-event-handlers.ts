// src/modules/mentions/mentions-utilities/mentions-event-handlers.ts
// Event handling functions for FileMentionsController

import { basename, dirname, extractQuery, isTriggerContext } from "@/modules/mentions/mentions-utilities/mentions-helpers";

// This file will contain event handling functions that can be used by the main controller
// We'll implement these functions as we integrate them into the main class

export type MentionsControllerContext = {
  root: HTMLElement | null;
  input: HTMLElement | null;
  popup: HTMLDivElement | null;
  visible: boolean;
  items: Array<{ path: string; type?: 'file' | 'dir' }>;
  activeIndex: number;
  indexingComplete: boolean;
  windowDragOverHandler: ((e: DragEvent) => void) | null;
  windowDropHandler: ((e: DragEvent) => void) | null;
  // Add other properties as needed
};

export function handleKeydown(
  ctx: MentionsControllerContext,
  ev: KeyboardEvent,
  show: () => void,
  hide: () => void,
  scheduleQuery: () => void,
  renderPopup: () => void,
  insertChip: (path: string) => void
) {
  if (!ctx.input) return;
  // Navigation within popup
  if (ctx.visible && ["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab"].includes(ev.key)) {
    ev.preventDefault();
    if (ev.key === 'ArrowDown') {
      if (ctx.items.length > 0) ctx.activeIndex = (ctx.activeIndex + 1) % ctx.items.length;
    }
    if (ev.key === 'ArrowUp') {
      if (ctx.items.length > 0) ctx.activeIndex = (ctx.activeIndex - 1 + ctx.items.length) % ctx.items.length;
    }
    if (ev.key === 'Escape') return hide();
    if (ev.key === 'Enter' || ev.key === 'Tab') {
      const item = ctx.items[ctx.activeIndex];
      if (item) insertChip(item.path);
      return;
    }
    renderPopup();
    return;
  }

  // Trigger rule: '@' at start or after whitespace
  if (ev.key === '@') {
    const ctxText = getBeforeCaretText(ctx.input);
    if (!isTriggerContext(ctxText)) return; // Not a trigger context
    ctx.activeIndex = 0;
    show();
    scheduleQuery();
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
        const prev = findPrevChip(ctx, tn);
        if (prev) {
          ev.preventDefault();
          prev.remove();
          return;
        }
      }
    }
  }
}

export function handleInput(
  ctx: MentionsControllerContext,
  show: () => void,
  hide: () => void,
  scheduleQuery: () => void
) {
  if (!ctx.input) return;
  const ctxText = getBeforeCaretText(ctx.input);
  if (isTriggerContext(ctxText)) {
    if (!ctx.visible) show();
    scheduleQuery();
  } else if (ctx.visible) {
    hide();
  }
}

export function handleKeyup(
  ctx: MentionsControllerContext,
  ev: KeyboardEvent,
  show: () => void,
  hide: () => void,
  scheduleQuery: () => void
) {
  if (!ctx.input) return;
  // Ignore navigation/confirm keys to avoid resetting selection
  if (["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(ev.key)) return;
  const ctxText = getBeforeCaretText(ctx.input);
  if (isTriggerContext(ctxText)) {
    if (!ctx.visible) show();
    scheduleQuery();
  }
}

export function handleMouseup(
  ctx: MentionsControllerContext,
  show: () => void,
  hide: () => void,
  scheduleQuery: () => void
) {
  if (!ctx.input) return;
  const ctxText = getBeforeCaretText(ctx.input);
  if (isTriggerContext(ctxText)) {
    if (!ctx.visible) show();
    scheduleQuery();
  } else if (ctx.visible) {
    hide();
  }
}

export function handleClickOutside(
  ctx: MentionsControllerContext,
  ev: MouseEvent
) {
  const t = ev.target as Node | null;
  if (!ctx.root || !t) return;
  if (ctx.root.contains(t)) return; // clicks inside are fine
  // We'll call hide() from the main controller
}

export function getBeforeCaretText(input: HTMLElement): string {
  if (!input) return '';
  const sel = input.ownerDocument.getSelection();
  if (!sel || sel.rangeCount === 0) return '';
  const r = sel.getRangeAt(0).cloneRange();
  r.setStart(input, 0);
  return r.toString();
}

export function findPrevChip(ctx: MentionsControllerContext, node: Node): HTMLElement | null {
  let cur: Node | null = node;
  while (cur && cur !== ctx.input) {
    const prev = cur.previousSibling;
    if (prev && prev instanceof HTMLElement && prev.classList.contains('mention-chip')) return prev;
    cur = cur.parentNode;
  }
  return null;
}

export function removeAtTokenBeforeNode(ctx: MentionsControllerContext, node: Node) {
  if (!ctx.input) return;
  const doc = ctx.input.ownerDocument;
  const walker = doc.createTreeWalker(ctx.input, NodeFilter.SHOW_TEXT);
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
