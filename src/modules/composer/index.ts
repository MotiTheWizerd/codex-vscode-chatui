// src/modules/composer/index.ts
// Public API surface: initComposer(host, options) → Composer

import { mountComposer } from "./composer-dom";
import type { Composer, ComposerOptions } from "./types";

export function initComposer(host: HTMLElement, opts: ComposerOptions = {}): Composer {
  return mountComposer(host, opts);
}

export type { Composer, ComposerOptions } from "./types";
