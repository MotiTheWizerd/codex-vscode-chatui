# Composer Module - markdown.ts

## Overview

The `markdown.ts` file contains minimal Markdown transformation functions used by the toolbar and keyboard shortcuts. These functions implement basic Markdown formatting operations like bold, italic, code blocks, etc.

## Implementation

```ts
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
```

## Functions

### toggleBold(selection)

Toggles bold formatting on the selected text:
- If the text is already bold (wrapped in `**`), it removes the formatting
- Otherwise, it wraps the text with `**` for bold formatting

### toggleItalic(selection)

Toggles italic formatting on the selected text:
- If the text is already italic (wrapped in `_`), it removes the formatting
- Otherwise, it wraps the text with `_` for italic formatting

### toggleInlineCode(selection)

Toggles inline code formatting on the selected text:
- If the text is already formatted as inline code (wrapped in `` ` ``), it removes the formatting
- Otherwise, it wraps the text with `` ` `` for inline code formatting

### toggleFence(selection)

Wraps the selected text in a fenced code block (```` ``` ````).

### toggleQuote(selection)

Toggles blockquote formatting on each line of the selected text:
- If lines start with `> `, it removes the quote marker
- Otherwise, it prepends `> ` to each line

### toggleList(selection)

Toggles list item formatting on each line of the selected text:
- If lines start with `- ` or `* `, it removes the list marker
- Otherwise, it prepends `- ` to each line

## Design Principles

1. **Simplicity**: Minimal implementation focused on basic Markdown transformations
2. **Safety**: No complex parsing or external dependencies
3. **Consistency**: Predictable behavior for all formatting operations
4. **Performance**: Lightweight functions that operate directly on strings