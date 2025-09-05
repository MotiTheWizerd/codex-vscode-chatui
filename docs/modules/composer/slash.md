# Composer Module - slash.ts

## Overview

The `slash.ts` file contains a tiny helper function for handling slash commands in the composer. It provides functionality to find matching commands based on user input, enabling the slash command autocomplete feature.

## Implementation

```ts
// src/modules/composer/slash.ts
// Tiny slash-command helper (optional for MVP)

import type { SlashCommand } from "./types";

export function findMatches(input: string, commands: SlashCommand[]): SlashCommand[] {
  const q = input.replace(/^\//, "").toLowerCase();
  if (!q) return commands;
  return commands.filter((c) => c.name.toLowerCase().includes(q));
}
```

## Functions

### findMatches(input, commands)

Finds slash commands that match the user's input:

1. Removes the leading slash from the input and converts to lowercase
2. If the input is empty (just a slash), returns all available commands
3. Otherwise, filters the commands to those whose names contain the input text

This function enables the autocomplete functionality for slash commands, showing users a list of relevant commands as they type.

## Design Principles

1. **Simplicity**: Minimal implementation focused on basic string matching
2. **Performance**: Efficient filtering algorithm that works well with small to medium command sets
3. **Usability**: Case-insensitive matching for better user experience
4. **Flexibility**: Matches substrings rather than just prefixes, making it easier to find commands