// src/modules/mentions/mentions-utilities/mentions-utils.ts
// Utility functions for FileMentionsController

import { FileMentionsDnD } from "@/modules/mentions/mentions-utilities/mentions-dnd";

export class FileMentionsUtils extends FileMentionsDnD {
  protected override insertChip(path: string) {
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

  protected override insertChips(paths: string[]) {
    if (!this.input) return;
    const existing = new Set(
      Array.from((this.root || this.input).querySelectorAll<HTMLElement>('.mention-chip'))
        .map((el) => el.dataset['path'])
        .filter(Boolean) as string[]
    );
    const list = paths.filter((p) => p && !existing.has(p));
    for (const p of list) this.insertChip(p);
  }
}
