# Composer Module - sanitize.ts

## Overview

The `sanitize.ts` file contains functions for normalizing and sanitizing pasted content. Its primary purpose is to ensure that only plain text is inserted into the composer, preventing potentially unsafe HTML or other content from being pasted into the webview.

## Implementation

```ts
// src/modules/composer/sanitize.ts
// Normalize paste → plain text only for safety in webview

export function normalizePaste(ev: ClipboardEvent): string | null {
  const dt = ev.clipboardData;
  if (!dt) return null;
  const text = dt.getData("text/plain");
  return text ?? "";
}
```

## Functions

### normalizePaste(event)

Extracts and normalizes plain text from a ClipboardEvent:

1. Gets the clipboard data from the event
2. If no clipboard data is available, returns null
3. Extracts plain text data from the clipboard
4. Returns the text or an empty string if no text is available

This function ensures that only plain text is extracted from paste events, ignoring any HTML or other formatted content that might be in the clipboard.

## Design Principles

1. **Security**: Prevents HTML or other potentially unsafe content from being pasted
2. **Simplicity**: Minimal implementation focused on extracting plain text
3. **Compatibility**: Works with standard ClipboardEvent API
4. **Safety**: Defaults to empty string when no text is available, preventing null-related issues