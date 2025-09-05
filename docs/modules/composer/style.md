# Composer Module - style.css

## Overview

The `style.css` file contains the scoped CSS styles for the composer module. It defines the visual appearance of the composer UI components including the toolbar, textarea, and slash command menu.

## Implementation

```css
/* src/modules/composer/style.css */
.composer { display: grid; gap: 8px; }
.toolbar { display: flex; gap: 6px; align-items: center; }
.toolbar button { padding: 4px 8px; border: 1px solid var(--vscode-editorWidget-border, #444); background: var(--vscode-editorWidget-background, #222); cursor: pointer; }
.composer-textarea { width: 100%; min-height: 96px; resize: vertical; padding: 8px; border: 1px solid var(--vscode-input-border, #555); background: var(--vscode-input-background, #1e1e1e); color: var(--vscode-input-foreground, #ddd); }
.slash-menu { border: 1px solid var(--vscode-editorWidget-border, #444); background: var(--vscode-editorWidget-background, #222); max-height: 160px; overflow: auto; padding: 6px; }
.slash-menu .active { outline: 1px solid var(--vscode-focusBorder, #888); }
```

## Styles

### .composer
The main container for the composer component:
- Uses CSS grid layout with 8px gap between elements

### .toolbar
The toolbar container:
- Uses flex layout with 6px gap between buttons
- Aligns items vertically centered

### .toolbar button
Styling for toolbar buttons:
- Padding of 4px vertical and 8px horizontal
- Border matching VS Code editor widget border color
- Background matching VS Code editor widget background
- Pointer cursor to indicate interactivity

### .composer-textarea
Styling for the main textarea:
- Full width (100%)
- Minimum height of 96px
- Vertically resizable
- 8px padding
- Border matching VS Code input border color
- Background matching VS Code input background
- Text color matching VS Code input foreground

### .slash-menu
Styling for the slash command dropdown:
- Border matching VS Code editor widget border color
- Background matching VS Code editor widget background
- Maximum height of 160px with auto overflow
- 6px padding

### .slash-menu .active
Styling for the currently selected slash command:
- Outline matching VS Code focus border color

## Design Principles

1. **VS Code Integration**: Uses VS Code CSS variables for consistent theming
2. **Scoped Styles**: All styles are scoped to the composer component
3. **Responsive**: Textarea is resizable and adapts to container width
4. **Accessibility**: Visual feedback for active elements
5. **Simplicity**: Minimal styling that focuses on functionality