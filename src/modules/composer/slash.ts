// src/modules/composer/slash.ts
// Tiny slash-command helper (optional for MVP)

import type { SlashCommand } from "./types";

export function findMatches(input: string, commands: SlashCommand[]): SlashCommand[] {
  const q = input.replace(/^\//, "").toLowerCase();
  if (!q) return commands;
  return commands.filter((c) => c.name.toLowerCase().includes(q));
}