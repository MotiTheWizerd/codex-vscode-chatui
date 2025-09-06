// src/modules/composer/composer-utilities/composer-dom-utils.ts
// DOM utility functions for the composer

import { sanitizeHtml } from "../sanitize";

// Insert sanitized HTML at the current caret position within the editor
export function insertHtmlAtCaret(editor: HTMLElement, html: string) {
  const sel = window.getSelection();
  if (!sel) return;
  let range: Range;
  if (sel.rangeCount > 0) {
    range = sel.getRangeAt(0);
    const anchorElem = (range.commonAncestorContainer as Node).nodeType === Node.ELEMENT_NODE
      ? (range.commonAncestorContainer as Element)
      : (range.commonAncestorContainer as Node).parentElement as Element | null;
    if (!anchorElem || !editor.contains(anchorElem)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
  } else {
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
  }

  // Build a fragment from provided HTML and a caret marker
  const marker = document.createElement('span');
  marker.setAttribute('data-caret', '1');
  marker.style.display = 'inline';
  marker.style.width = '0';
  marker.style.height = '0';

  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const frag = document.createDocumentFragment();
  while (tpl.content.firstChild) frag.appendChild(tpl.content.firstChild);
  frag.appendChild(marker);

  range.insertNode(frag);

  // Move caret before the marker and remove it
  const sel2 = window.getSelection();
  if (sel2) {
    const r2 = document.createRange();
    r2.setStartBefore(marker);
    r2.collapse(true);
    sel2.removeAllRanges();
    sel2.addRange(r2);
  }
  marker.parentNode?.removeChild(marker);
}

export function revokeUrl(url: string, objectUrls: string[]) {
  try { URL.revokeObjectURL(url); } catch {}
  const idx = objectUrls.indexOf(url);
  if (idx >= 0) objectUrls.splice(idx, 1);
}