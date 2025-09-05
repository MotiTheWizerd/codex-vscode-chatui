# Composer Module - index.ts

## Overview

The `index.ts` file serves as the public API surface for the composer module. It exports the `initComposer` function which is the main entry point for initializing the composer component (framework‑free DOM implementation).

## Implementation

```ts
// src/modules/composer/index.ts
// Public API surface: initComposer(host, options) → Composer

import { mountComposer } from "./composer-dom";
import type { Composer, ComposerOptions } from "./types";

export function initComposer(host: HTMLElement, opts: ComposerOptions = {}): Composer {
  return mountComposer(host, opts);
}

export type { Composer, ComposerOptions } from "./types";
```

## API

### initComposer(host, options)

Initializes and mounts the composer component to the specified host element.

**Parameters:**
- `host` (HTMLElement): The DOM element to mount the composer to
- `options` (ComposerOptions): Configuration options for the composer

**Returns:**
- `Composer`: An object with methods to interact with the composer

## Design Principles

1. **Simple API**: Provides a clean and straightforward initialization function
2. **Type Safety**: Exports proper TypeScript types for the Composer and its options
3. **Isolation**: Serves as the only public interface to the module, keeping implementation details private
4. **Alias Imports**: Use `@/modules/composer` when importing from outside the module
