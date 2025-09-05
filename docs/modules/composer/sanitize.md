# Composer Module - sanitize.ts

## Overview

The `sanitize.ts` module provides two primary responsibilities:

- Sanitize arbitrary HTML to a safe, limited subset suitable for the webview editor
- Normalize pasted clipboard content into sanitized HTML, or escaped text with `<br>` line breaks

This defends the webview against script injection and unsafe attributes while preserving user intent for common formatting.

## Key Functions

### sanitizeHtml(inputHtml: string): string
Parses the provided HTML and removes unsafe tags and attributes.

- Allowed tags: `B, STRONG, I, EM, U, S, CODE, PRE, BLOCKQUOTE, BR, P, DIV, SPAN, UL, OL, LI, A`
- Removes: `SCRIPT, STYLE, IFRAME, OBJECT, EMBED, META, LINK`
- Strips event handlers (attributes starting with `on`) and inline `style`
- For URL-bearing attributes (`href`, `src`), only allows safe schemes (`http:`, `https:`, `mailto:`, `about:`, `data:`, `file:`)
- Keeps non-dangerous attributes: `class`, `title`, `alt`

Returns sanitized HTML as a string.

### normalizePasteToHtml(ev: ClipboardEvent): string | null
Converts clipboard data into sanitized HTML.

Order of preference:
- If clipboard has `text/html`: sanitize and return it.
- Else use `text/plain`, HTML‑escape it, and replace line breaks with `<br>`.
- Returns `null` if no clipboard data is available.

### normalizePaste(ev: ClipboardEvent): string | null
Back‑compat helper that extracts plain text only; used by older legacy composer paths. New DOM composer uses `normalizePasteToHtml`.

## Usage Notes

- The DOM composer inserts the returned HTML at the caret using Selection/Range APIs.
- Always pair `normalizePasteToHtml` with `sanitizeHtml` when accepting HTML input from any source.

## Design Principles

1. **Security**: Aggressively removes scriptable/unsafe content and attributes
2. **Fidelity**: Preserves safe structure and converts plain text to line‑broken HTML
3. **Simplicity**: DOM‑based traversal without external dependencies
