// src/modules/composer/composer-dom.ts
// Framework-free DOM composer (no React)

import { sanitizeHtml, normalizePasteToHtml } from "./sanitize";
import { FileMentionsController } from "@/modules/mentions/index.js";
import { findMatches } from "./slash";
import type { Composer, ComposerEvent, ComposerOptions, SlashCommand, ComposerAttachment } from "./types";

export function mountComposer(host: HTMLElement, opts: ComposerOptions): Composer {
  const listeners = new Set<(e: ComposerEvent) => void>();
  const emit = (e: ComposerEvent) => listeners.forEach((fn) => fn(e));

  // Build DOM structure
  host.innerHTML = "";
  const container = document.createElement("div");
  container.className = "composer";
  // Hook for mentions controller (Stage 1)
  container.setAttribute('data-mentions', '1');
  const preview = document.createElement('div');
  preview.className = 'composer-preview';
  const attachments: ComposerAttachment[] = [];
  const objectUrls: string[] = [];
  const editor = document.createElement("div");
  editor.className = "composer-editor";
  editor.setAttribute('contenteditable','true');
  editor.setAttribute('data-placeholder', opts.placeholder ?? 'Message…');
  // Hook for mentions controller (Stage 1)
  editor.setAttribute('data-composer-input', '1');
  // Accessibility attributes for contenteditable textbox
  editor.setAttribute('role', 'textbox');
  editor.setAttribute('aria-multiline', 'true');
  editor.setAttribute('aria-label', opts.placeholder ?? 'Message');
  editor.spellcheck = false;
  editor.innerHTML = sanitizeHtml(opts.initialValue ?? "");
  const slashMenu = document.createElement("div");
  slashMenu.className = "slash-menu";
  slashMenu.style.display = "none";

  // No toolbar — operations can be added later via commands

  container.append(preview, editor, slashMenu);
  host.appendChild(container);

  // Mentions controller (UI-only, mock data in Stage 1)
  const mentions = new FileMentionsController();
  try { mentions.mount(container); } catch (e) { console.warn('mentions mount failed', e); }

  // Insert sanitized HTML at the current caret position within the editor
  const insertHtmlAtCaret = (html: string) => {
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
  };

  const revokeUrl = (url: string) => {
    try { URL.revokeObjectURL(url); } catch {}
    const idx = objectUrls.indexOf(url);
    if (idx >= 0) objectUrls.splice(idx, 1);
  };

  const addImageAttachment = (file: File) => {
    if (attachments.length >= 5) return;
    const url = URL.createObjectURL(file);
    objectUrls.push(url);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      attachments.push({ kind: 'image', name: file.name || 'image', type: file.type || 'image/*', size: file.size || 0, dataUrl });
      const img = document.createElement('img');
      img.src = url;
      img.alt = file.name || 'pasted image';
      img.className = 'composer-preview-img';
      const onLoadOrError = () => revokeUrl(url);
      img.addEventListener('load', onLoadOrError, { once: true });
      img.addEventListener('error', onLoadOrError, { once: true });
      preview.appendChild(img);
      emit({ type: 'change', value: editor.innerHTML, attachments: attachments.slice() });
    };
    reader.readAsDataURL(file);
  };

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
      insertHtmlAtCaret(html);
      emit({ type: 'change', value: editor.innerHTML, attachments: attachments.slice() });
    }
  };
  const onPasteListener: EventListener = (ev) => onPaste(ev as ClipboardEvent);
  editor.addEventListener("paste", onPasteListener);

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

  const submit = () => {
    const v = editor.innerText.trim();
    if (!v) return;
    if (opts.maxLength && v.length > opts.maxLength) return;
    emit({ type: "submit", value: editor.innerHTML, attachments: attachments.slice() });
    // Clear previews after submit
    while (preview.firstChild) preview.removeChild(preview.firstChild);
    attachments.splice(0, attachments.length);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") { e.preventDefault(); submit(); }

    if (e.key === "/") { showSlash = true; slashIndex = 0; slashItems = opts.slashCommands ?? []; renderSlashMenu(); }
    if (showSlash && ["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
      e.preventDefault();
      if (e.key === "ArrowDown") slashIndex = Math.min(slashIndex + 1, Math.max(0, slashItems.length - 1));
      if (e.key === "ArrowUp") slashIndex = Math.max(slashIndex - 1, 0);
      if (e.key === "Escape") { showSlash = false; }
      if (e.key === "Enter" && slashItems[slashIndex]) {
        const cmd = slashItems[slashIndex]!;
        cmd.run({
          insert: (t) => { insertHtmlAtCaret(sanitizeHtml(t)); emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() }); },
          getValue: () => editor.innerHTML,
          setValue: (v) => { editor.innerHTML = sanitizeHtml(v); emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() }); },
        });
        showSlash = false;
      }
      renderSlashMenu();
    }
  };

  const onInput = () => {
    // Normalize empty contentEditable to truly empty (no stray <br>)
    if (editor.innerHTML === '<br>') editor.innerHTML = '';
    emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() });
    if (showSlash) updateSlashCandidates();
  };

  const onKeyDownListener: EventListener = (ev) => onKeyDown(ev as KeyboardEvent);
  const onInputListener: EventListener = () => onInput();
  editor.addEventListener("keydown", onKeyDownListener);
  editor.addEventListener("input", onInputListener);

  if (editor.innerText.trim()) emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() });

  return {
    getValue: () => editor.innerHTML,
    getAttachments: () => attachments.slice(),
    getEmbeddedFiles: () => {
      try { return mentions.collectEmbeddedFiles(); } catch { return []; }
    },
    setValue: (v: string) => { editor.innerHTML = sanitizeHtml(v); emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() }); },
    clearAttachments: () => {
      while (preview.firstChild) preview.removeChild(preview.firstChild);
      attachments.splice(0, attachments.length);
      // Revoke any remaining object URLs
      for (const u of objectUrls.splice(0, objectUrls.length)) revokeUrl(u);
      emit({ type: 'change', value: editor.innerHTML, attachments: attachments.slice() });
    },
    focus: () => editor.focus(),
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    dispose: () => {
      editor.removeEventListener("paste", onPasteListener);
      editor.removeEventListener("keydown", onKeyDownListener);
      editor.removeEventListener("input", onInputListener);
      listeners.clear();
      try { mentions.dispose(); } catch {}
      // Revoke any remaining object URLs
      for (const u of objectUrls.splice(0, objectUrls.length)) revokeUrl(u);
      host.innerHTML = "";
    },
  };
}

