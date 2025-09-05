# Composer Module - types.ts

## Overview

The `types.ts` file defines all the TypeScript types used throughout the composer module. This includes event types, slash command definitions, composer options, and the composer interface itself.

## Implementation

```ts
// src/modules/composer/types.ts

export type ComposerEvent =
  | { type: "change"; value: string }
  | { type: "submit"; value: string }
  | { type: "command"; name: string; args?: any };

export interface SlashCommand {
  name: string;
  hint: string;
  run: (ctx: { insert: (t: string) => void; getValue: () => string; setValue: (v: string) => void }) => void;
}

export interface ComposerOptions {
  initialValue?: string;
  placeholder?: string;
  maxLength?: number;
  slashCommands?: SlashCommand[];
}

export interface Composer {
  getValue(): string;
  setValue(v: string): void;
  focus(): void;
  on(fn: (e: ComposerEvent) => void): () => void; // unsubscribe
  dispose(): void;
}
```

## Types

### ComposerEvent

A union type representing all possible events that can be emitted by the composer:

1. `change` - Emitted when the composer value changes
2. `submit` - Emitted when the user submits the message
3. `command` - Emitted when a slash command is executed

### SlashCommand

Interface defining the structure of a slash command:

- `name` - The command name (what comes after the /)
- `hint` - A short description of what the command does
- `run` - A function that executes the command

### ComposerOptions

Interface defining the configuration options for the composer:

- `initialValue` - Initial text value for the composer
- `placeholder` - Placeholder text when the composer is empty
- `maxLength` - Maximum allowed length for the input
- `slashCommands` - Array of available slash commands

### Composer

Interface defining the public API of the composer instance:

- `getValue()` - Returns the current value of the composer
- `setValue(v)` - Sets the value of the composer
- `focus()` - Focuses the composer input
- `on(fn)` - Registers an event listener, returns an unsubscribe function
- `dispose()` - Cleans up the composer instance

## Design Principles

1. **Type Safety**: Comprehensive typing for all module interfaces
2. **Extensibility**: Easily extendable types for future features
3. **Clarity**: Clear and descriptive type names