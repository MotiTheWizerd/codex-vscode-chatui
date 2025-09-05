// src/modules/composer/composer-dom.ts
// Framework-free DOM composer (no React)

import { sanitizeHtml, normalizePasteToHtml } from "./sanitize";
import { findMatches } from "./slash";
import type { Composer, ComposerEvent, ComposerOptions, SlashCommand, ComposerAttachment } from "./types";

export function mountComposer(host: HTMLElement, opts: ComposerOptions): Composer {
  const listeners = new Set<(e: ComposerEvent) => void>();
  const emit = (e: ComposerEvent) => listeners.forEach((fn) => fn(e));

  // Build DOM structure
  host.innerHTML = "";
  const container = document.createElement("div");
  container.className = "composer";
  const preview = document.createElement('div');
  preview.className = 'composer-preview';
  const attachments: ComposerAttachment[] = [];
  const editor = document.createElement("div");
  editor.className = "composer-editor";
  editor.setAttribute('contenteditable','true');
  editor.setAttribute('data-placeholder', opts.placeholder ?? 'Message…');
  editor.spellcheck = false as any;
  editor.innerHTML = sanitizeHtml(opts.initialValue ?? "");
  const slashMenu = document.createElement("div");
  slashMenu.className = "slash-menu";
  slashMenu.style.display = "none";

  // No toolbar — operations can be added later via commands

  container.append(preview, editor, slashMenu);
  host.appendChild(container);

  const addImageAttachment = (file: File) => {
    if (attachments.length >= 5) return;
    const url = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      attachments.push({ kind: 'image', name: file.name || 'image', type: file.type || 'image/*', size: file.size || 0, dataUrl });
      const img = document.createElement('img');
      img.src = url;
      img.alt = file.name || 'pasted image';
      img.className = 'composer-preview-img';
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
      // Insert sanitized HTML at caret
      document.execCommand('insertHTML', false, html);
      emit({ type: 'change', value: editor.innerHTML, attachments: attachments.slice() });
    }
  };
  editor.addEventListener("paste", onPaste as any);

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
      row.innerHTML = `<strong>/${c.name}</strong> â€” ${c.hint}`;
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
          insert: (t) => { document.execCommand('insertHTML', false, sanitizeHtml(t)); emit({ type: "change", value: editor.innerHTML }); },
          getValue: () => editor.innerHTML,
          setValue: (v) => { editor.innerHTML = sanitizeHtml(v); emit({ type: "change", value: editor.innerHTML }); },
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

  editor.addEventListener("keydown", onKeyDown);
  editor.addEventListener("input", onInput);

  if (editor.innerText.trim()) emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() });

  return {
    getValue: () => editor.innerHTML,
    getAttachments: () => attachments.slice(),
    setValue: (v: string) => { editor.innerHTML = sanitizeHtml(v); emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() }); },
    clearAttachments: () => { while (preview.firstChild) preview.removeChild(preview.firstChild); attachments.splice(0, attachments.length); emit({ type: 'change', value: editor.innerHTML, attachments: attachments.slice() }); },
    focus: () => editor.focus(),
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    dispose: () => {
      editor.removeEventListener("paste", onPaste as any);
      editor.removeEventListener("keydown", onKeyDown);
      editor.removeEventListener("input", onInput);
      listeners.clear();
      host.innerHTML = "";
    },
  };
}

