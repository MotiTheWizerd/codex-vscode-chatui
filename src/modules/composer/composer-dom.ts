// src/modules/composer/composer-dom.ts
// Framework-free DOM composer (no React)

import { sanitizeHtml, normalizePasteToHtml } from "./sanitize";
import { FileMentionsController } from "@/modules/mentions/index.js";
import type { Composer, ComposerEvent, ComposerOptions, SlashCommand, ComposerAttachment } from "./types";

// Import utility modules
import { createComposerElements, setupMentionsController, createSubmitFunction } from "./composer-utilities/composer-core";
import { insertHtmlAtCaret, revokeUrl } from "./composer-utilities/composer-dom-utils";
import { setupPasteHandler, setupKeyboardHandler, setupInputHandler } from "./composer-utilities/composer-events";
import { createAttachmentHandlers } from "./composer-utilities/composer-attachments";
import { setupSlashCommandHandler } from "./composer-utilities/composer-slash";

export function mountComposer(host: HTMLElement, opts: ComposerOptions): Composer {
  const listeners = new Set<(e: ComposerEvent) => void>();
  const emit = (e: ComposerEvent) => listeners.forEach((fn) => fn(e));

  // Create core elements
  const { container, preview, editor, slashMenu } = createComposerElements(host, opts);
  
  // Setup mentions controller
  const mentions = setupMentionsController(container);

  const attachments: ComposerAttachment[] = [];
  const objectUrls: string[] = [];
  
  // Setup attachment handlers
  const { addImageAttachment, clearAttachments } = createAttachmentHandlers(
    preview, attachments, objectUrls, emit, editor
  );

  // Setup event handlers
  const onPasteListener = setupPasteHandler(editor, emit, attachments, addImageAttachment);
  
  // Setup slash command handler
  const slashHandler = setupSlashCommandHandler(editor, opts, emit, attachments, 
    (html) => insertHtmlAtCaret(editor, html), slashMenu);
  
  // Setup keyboard handler
  const submit = createSubmitFunction(editor, opts, emit, attachments, preview);
  const { onKeyDownListener, updateSlashCandidates, showSlash } = setupKeyboardHandler(
    editor, opts, emit, submit, 
    (html) => insertHtmlAtCaret(editor, html), 
    attachments, slashMenu
  );
  
  // Setup input handler
  const onInputListener = setupInputHandler(editor, emit, attachments, updateSlashCandidates, showSlash);

  if (editor.innerText.trim()) emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() });

  return {
    getValue: () => editor.innerHTML,
    getAttachments: () => attachments.slice(),
    getEmbeddedFiles: () => {
      try { return mentions.collectEmbeddedFiles(); } catch { return []; }
    },
    setValue: (v: string) => { 
      editor.innerHTML = sanitizeHtml(v); 
      emit({ type: "change", value: editor.innerHTML, attachments: attachments.slice() }); 
    },
    clearAttachments,
    focus: () => editor.focus(),
    on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    dispose: () => {
      editor.removeEventListener("paste", onPasteListener);
      editor.removeEventListener("keydown", onKeyDownListener);
      editor.removeEventListener("input", onInputListener);
      listeners.clear();
      try { mentions.dispose(); } catch {}
      // Revoke any remaining object URLs
      for (const u of objectUrls.splice(0, objectUrls.length)) revokeUrl(u, objectUrls);
      host.innerHTML = "";
    },
  };
}