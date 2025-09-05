# Composer Module

## Overview

The composer module is a lightweight chat composer for VS Code webviews. It provides a Markdown-first editing experience with a minimal toolbar and slash command support.

## Features

- Plaintext Markdown model (diff‑friendly, safe)
- Toolbar: **B**, *I*, `code`, ``` fence ```, quote, list, Send
- Slash commands (optional): `/template`, `/attach`, etc.
- Paste sanitization to prevent unsafe content
- VS Code webview integration

## Module Structure

```
src/
  modules/
    composer/
      index.ts          # Public API (init, dispose, etc.)
      composer-dom.ts   # Framework-free DOM composer (current implementation)
      markdown.ts       # Markdown helpers (bold, italic, code, list…)
      sanitize.ts       # Paste normalization/sanitization
      slash.ts          # Slash command registry (optional, extend later)
      types.ts          # Types for Composer, events, options
      bridge.ts         # (legacy) webview ↔ VS Code message bridge
      style.css         # (legacy) scoped CSS (migrated to media/chat/styles)
      README.md         # Module documentation
```

## Usage

```ts
import { initComposer } from "@/modules/composer";

// In your webview script after DOM ready
const host = document.getElementById('composer-root')!;
const composer = initComposer(host, { placeholder: 'Message…' });
```

**HTML host:**

```html
<div id="composer"></div>
```

**Events posted to extension (via bootstrap wiring):** `chat.userMessage { text, attachments }`

## Implementation Details

Each file in the module has a specific responsibility:

- `index.ts` - Public API surface
- `types.ts` - TypeScript type definitions
- `markdown.ts` - Markdown transformation functions
- `sanitize.ts` - Paste normalization/sanitization
- `slash.ts` - Slash command helper
- `composer-dom.ts` - DOM composer (contenteditable) with paste sanitization and attachments
- `bridge.ts` - VS Code webview integration
- `style.css` - Scoped CSS styles

## Design Principles

1. **Modularity**: Isolated module with clear boundaries
2. **Extensibility**: Easy to add new features without modifying existing code
3. **Security**: Paste sanitization and safe Markdown transformations
4. **Performance**: Lightweight implementation with minimal dependencies
5. **VS Code Integration**: Follows VS Code theming and API conventions
6. **Alias Imports**: Use path aliases (e.g., `@/modules/composer`)

## Future Extensions

The module is designed to be easily extended with additional features:
- Mentions support
- Richer attachment handling and non-image types
- More sophisticated formatting options
- Advanced slash commands

These can be added as new files in the module without modifying the existing implementation.
