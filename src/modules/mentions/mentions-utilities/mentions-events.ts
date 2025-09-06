// src/modules/mentions/mentions-utilities/mentions-events.ts
// Event handling logic for FileMentionsController

import { FileMentionsUI } from "@/modules/mentions/mentions-utilities/mentions-ui";

export class FileMentionsEvents extends FileMentionsUI {
  public override dispose() {
    if (this.input) {
      this.input.removeEventListener('keydown', this.onKeydown as EventListener);
      this.input.removeEventListener('input', this.onInput as EventListener);
      this.input.removeEventListener('keyup', this.onKeyup as EventListener);
      this.input.removeEventListener('mouseup', this.onMouseup as EventListener);
    }
    // Use the same handler reference form used when adding listeners
    document.removeEventListener('click', this.onClickOutside as EventListener, true);
    super.dispose();
  }
  protected onKeydown(ev: KeyboardEvent) {
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

  protected onInput() {
    const ctxText = this.getBeforeCaretText();
    if (this.isTriggerContext(ctxText)) {
      if (!this.visible) this.show();
      this.scheduleQuery();
    } else if (this.visible) {
      this.hide();
    }
  }

  protected onKeyup(ev: KeyboardEvent) {
    // Ignore navigation/confirm keys to avoid resetting selection
    if (["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(ev.key)) return;
    const ctxText = this.getBeforeCaretText();
    if (this.isTriggerContext(ctxText)) {
      if (!this.visible) this.show();
      this.scheduleQuery();
    }
  }

  protected onMouseup() {
    const ctxText = this.getBeforeCaretText();
    if (this.isTriggerContext(ctxText)) {
      if (!this.visible) this.show();
      this.scheduleQuery();
    } else if (this.visible) {
      this.hide();
    }
  }

  protected onClickOutside(ev: MouseEvent) {
    const t = ev.target as Node | null;
    if (!this.root || !t) return;
    if (this.root.contains(t)) return; // clicks inside are fine
    this.hide();
  }

  protected getBeforeCaretText(): string {
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
  protected isTriggerContext(ctx: string): boolean {
    if (!ctx) return false;
    if ((/(^|\s)@\S*$/).test(ctx)) return true; // '@foo' style
    if ((/(^|\s)@\s$/).test(ctx)) return true; // '@ ' style
    return false;
  }

  // Extract the current query (text after '@' up to caret), empty string for '@ ' cases
  protected extractQuery(ctx: string): string {
    const m = ctx.match(/(^|\s)@(\S*)$/);
    if (m) return (m[2] || '').toLowerCase();
    return '';
  }

  protected findPrevChip(node: Node): HTMLElement | null {
    let cur: Node | null = node;
    while (cur && cur !== this.input) {
      const prev = cur.previousSibling;
      if (prev && prev instanceof HTMLElement && prev.classList.contains('mention-chip')) return prev;
      cur = cur.parentNode;
    }
    return null;
  }

  // Remove the @mention token (e.g., "@foo") immediately before the given node
  protected removeAtTokenBeforeNode(node: Node) {
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
}
