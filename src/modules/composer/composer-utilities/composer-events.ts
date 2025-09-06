// src/modules/composer/composer-utilities/composer-events.ts
// Event handling for the composer

import { normalizePasteToHtml, sanitizeHtml } from "../sanitize";
import { insertHtmlAtCaret } from "./composer-dom-utils";
import type { ComposerOptions, SlashCommand } from "../types";
import { findMatches } from "../slash";

export function setupPasteHandler(
  editor: HTMLElement, 
  emit: (event: any) => void, 
  attachments: any[], 
  addImageAttachment: (file: File) => void
) {
  const onPaste = (ev: ClipboardEvent) => {
    let handledImage = false;
    const items = ev.clipboardData?.items;
    if (items && items.length) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it && it.kind === 'file' && it.type && it.type.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) {
            addImageAttachment(file);
            handledImage = true;
            if (attachments.length >= 5) break;
          }
        }
      }
    }
    if (handledImage) {
      ev.preventDefault();
      return;
    }
    const html = normalizePasteToHtml(ev);
    if (html != null) {
      ev.preventDefault();
      // Insert sanitized HTML at caret using Range APIs
      insertHtmlAtCaret(editor, html);
      emit({ type: 'change', value: editor.innerHTML, attachments: attachments.slice() });
    }
  };
  
  const onPasteListener: EventListener = (ev) => onPaste(ev as ClipboardEvent);
  editor.addEventListener("paste", onPasteListener);
  
  return onPasteListener;
}

export function setupKeyboardHandler(
  editor: HTMLElement,
  opts: ComposerOptions,
  emit: (event: any) => void,
  submit: () => void,
  insertHtmlAtCaret: (html: string) => void,
  attachments: any[],
  slashMenu: HTMLElement
) {
  let showSlash = false;
  let slashIndex = 0;
  let slashItems: SlashCommand[] = opts.slashCommands ?? [];

  const renderSlashMenu = () => {
    if (!showSlash || slashItems.length === 0) {
      slashMenu.style.display = "none";
      slashMenu.innerHTML = "";
      return;
    }
    slashMenu.style.display = "block";
    slashMenu.innerHTML = "";
    slashItems.forEach((c, i) => {
      const row = document.createElement("div");
      if (i === slashIndex) row.className = "active";
      row.innerHTML = `<strong>/${c.name}</strong> &mdash; ${c.hint}`;
      slashMenu.appendChild(row);
    });
  };

  const updateSlashCandidates = () => {
    const v = editor.innerText;
    const lastSlash = v.lastIndexOf("/");
    if (lastSlash >= 0) {
      const q = v.slice(lastSlash);
      slashItems = findMatches(q, opts.slashCommands ?? []);
      showSlash = true;
      slashIndex = 0;
    } else {
      showSlash = false;
      slashItems = [];
    }
    renderSlashMenu();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") { 
      e.preventDefault(); 
      submit(); 
    }

    if (e.key === "/") { 
      showSlash = true; 
      slashIndex = 0; 
      slashItems = opts.slashCommands ?? []; 
      renderSlashMenu(); 
    }
    
    if (showSlash && ["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
      e.preventDefault();
      if (e.key === "ArrowDown") slashIndex = Math.min(slashIndex + 1, Math.max(0, slashItems.length - 1));
      if (e.key === "ArrowUp") slashIndex = Math.max(slashIndex - 1, 0);
      if (e.key === "Escape") { showSlash = false; }
      if (e.key === "Enter" && slashItems[slashIndex]) {
        const cmd = slashItems[slashIndex]!;
        cmd.run({
          insert: (t) => { 
            insertHtmlAtCaret(t); 
            emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() }); 
          },
          getValue: () => editor.innerHTML,
          setValue: (v) => { 
            editor.innerHTML = sanitizeHtml(v); 
            emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() }); 
          },
        });
        showSlash = false;
      }
      renderSlashMenu();
    }
  };

  const onKeyDownListener: EventListener = (ev) => onKeyDown(ev as KeyboardEvent);
  editor.addEventListener("keydown", onKeyDownListener);
  
  return { onKeyDownListener, updateSlashCandidates, showSlash };
}

export function setupInputHandler(
  editor: HTMLElement,
  emit: (event: any) => void,
  attachments: any[],
  updateSlashCandidates: () => void,
  showSlash: boolean
) {
  const onInput = () => {
    // Normalize empty contentEditable to truly empty (no stray <br>)
    if (editor.innerHTML === '<br>') editor.innerHTML = '';
    emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() });
    if (showSlash) updateSlashCandidates();
  };

  const onInputListener: EventListener = () => onInput();
  editor.addEventListener("input", onInputListener);
  
  return onInputListener;
}