// src/modules/composer/composer-utilities/composer-core.ts
// Core composer functionality

import { sanitizeHtml } from "../sanitize";
import { FileMentionsController } from "@/modules/mentions/index.js";
import type { Composer, ComposerOptions } from "../types";

export function createComposerElements(host: HTMLElement, opts: ComposerOptions) {
  // Build DOM structure
  host.innerHTML = "";
  const container = document.createElement("div");
  container.className = "composer";
  // Hook for mentions controller (Stage 1)
  container.setAttribute('data-mentions', '1');
  
  const preview = document.createElement('div');
  preview.className = 'composer-preview';
  
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

  container.append(preview, editor, slashMenu);
  host.appendChild(container);
  
  return { container, preview, editor, slashMenu };
}

export function setupMentionsController(container: HTMLElement) {
  // Mentions controller (UI-only, mock data in Stage 1)
  const mentions = new FileMentionsController();
  try { 
    mentions.mount(container); 
  } catch (e) { 
    console.warn('mentions mount failed', e); 
  }
  return mentions;
}

export function createSubmitFunction(editor: HTMLElement, opts: ComposerOptions, emit: (event: any) => void, attachments: any[], preview: HTMLElement) {
  return () => {
    const v = editor.innerText.trim();
    if (!v) return;
    if (opts.maxLength && v.length > opts.maxLength) return;
    emit({ type: "submit", value: editor.innerHTML, attachments: attachments.slice() });
    // Clear previews after submit
    while (preview.firstChild) preview.removeChild(preview.firstChild);
    attachments.splice(0, attachments.length);
  };
}