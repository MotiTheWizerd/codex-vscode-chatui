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
      composer.tsx      # React component with textarea, toolbar, events
      markdown.ts       # Markdown helpers (bold, italic, code, list…)
      sanitize.ts       # Paste normalization/sanitization
      slash.ts          # Slash command registry (optional, extend later)
      types.ts          # Types for Composer, events, options
      bridge.ts         # Webview ↔ VS Code message bridge
      style.css         # Scoped CSS for composer only
      README.md         # Module documentation
```

## Usage

```ts
import { attachComposer } from "@/modules/composer/bridge";

// In your webview script after DOM ready
attachComposer();
```

**HTML host:**

```html
<div id="composer"></div>
```

**Events posted to extension:** `{ type: "user.send", text }`

## Implementation Details

Each file in the module has a specific responsibility:

- `index.ts` - Public API surface
- `types.ts` - TypeScript type definitions
- `markdown.ts` - Markdown transformation functions
- `sanitize.ts` - Paste normalization/sanitization
- `slash.ts` - Slash command helper
- `composer.tsx` - Main React component
- `bridge.ts` - VS Code webview integration
- `style.css` - Scoped CSS styles

## Design Principles

1. **Modularity**: Isolated module with clear boundaries
2. **Extensibility**: Easy to add new features without modifying existing code
3. **Security**: Paste sanitization and safe Markdown transformations
4. **Performance**: Lightweight implementation with minimal dependencies
5. **VS Code Integration**: Follows VS Code theming and API conventions

## Future Extensions

The module is designed to be easily extended with additional features:
- Mentions support
- Attachment handling
- More sophisticated formatting options
- Advanced slash commands

These can be added as new files in the module without modifying the existing implementation.