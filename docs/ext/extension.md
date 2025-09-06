# Extension Module

## Overview

The extension module is the entry point for the Codex VS Code extension. It handles extension activation, command registration, and coordination of all other modules.

## Implementation Status

This module is partially implemented. It provides basic extension activation and command registration.

## Current Features

- Extension activation
- Command registration
- Basic coordination of core services
- Sidebar View registration for Chat (`codex.chatView`)

## Planned Features

- More comprehensive command registration
- Event handling for VS Code lifecycle events
- Better integration with all other modules
- Improved error handling and recovery

## Sidebar Chat View

- View Container: `codex` (Activity Bar icon)
- View: `codex.chatView` (WebviewView)
- Focus Command: `codex.chat.focus` (alias to `workbench.view.showView` for the view id)

## Design Principles

1. **Entry Point**: Serves as the single entry point for the extension
2. **Coordination**: Coordinates initialization of all other modules
3. **Integration**: Integrates with VS Code's extension API
4. **Error Handling**: Provides robust error handling for extension lifecycle
