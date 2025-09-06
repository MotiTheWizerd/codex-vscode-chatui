// src/modules/composer/composer-utilities/comcomposer-slash.ts
// Slash command functionality for the composer

import type { SlashCommand } from "../types";
import { findMatches } from "../slash";

export function setupSlashCommandHandler(
  editor: HTMLElement,
  opts: any,
  emit: (event: any) => void,
  attachments: any[],
  insertHtmlAtCaret: (html: string) => void,
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

  return { 
    showSlash, 
    slashIndex, 
    slashItems, 
    renderSlashMenu, 
    updateSlashCandidates 
  };
}