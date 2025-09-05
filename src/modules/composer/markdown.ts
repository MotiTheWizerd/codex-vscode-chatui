// src/modules/composer/markdown.ts
// Minimal Markdown transforms used by toolbar/shortcuts

export const toggleBold = (s: string) =>
  s.startsWith("**") && s.endsWith("**") && s.length >= 4 ? s.slice(2, -2) : `**${s || "bold"}**`;

export const toggleItalic = (s: string) =>
  s.startsWith("_") && s.endsWith("_") && s.length >= 2 ? s.slice(1, -1) : `_${s || "italic"}_`;

export const toggleInlineCode = (s: string) =>
  s.startsWith("`") && s.endsWith("`") && s.length >= 2 ? s.slice(1, -1) : `\`${s || "code"}\``;

export const toggleFence = (s: string) => {
  const body = s || "code";
  // Always wrap selection in a fenced block for MVP
  return "```\n" + body + "\n```";
};

export const toggleQuote = (s: string) => s
  .split("\n")
  .map((l) => (l.startsWith("> ") ? l.slice(2) : "> " + (l || "")))
  .join("\n");

export const toggleList = (s: string) => s
  .split("\n")
  .map((l) => (/^[-*]\s/.test(l) ? l.replace(/^[-*]\s/, "") : "- " + (l || "")))
  .join("\n");