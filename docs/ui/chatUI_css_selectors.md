# Chat UI CSS Selectors

This document outlines the CSS selectors used in the chat panel UI, with a focus on the footer elements.

## Footer Elements

The footer section of the chat panel contains several key elements for user interaction:

### Input Container

```css
.input-container {
  background: #2d2d30;
  border-top: 1px solid #404040;
  padding: 16px;
  flex-shrink: 0;
}
```

Note: There's a duplicate rule with `!important` declarations that overrides the background and color:

```css
.input-container {
  background: #252526 !important;
  color: red !important;
}
```

### Context Bar

```css
.context-bar {
  background: #252526;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #cccccc;
}

.context-icon {
  color: #ffd700;
}
```

### Agent Selector

```css
.agent-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.agent-label {
  font-size: 12px;
  color: #cccccc;
  display: flex;
  align-items: center;
  gap: 6px;
}

.agent-dropdown {
  border: 1px solid #404040;
  border-radius: 4px;
  color: #cccccc;
  padding: 4px 8px;
  font-size: 12px;
  outline: none;
}

.agent-dropdown:focus {
  border-color: #ffd700;
}
```

### Input Wrapper

```css
.input-wrapper {
  position: relative;
  display: flex;
  align-items: flex-end;
  background: #1e1e1e;
  border: 0.2px solid #404040;
  border-radius: 6px;
  padding: 2px;
  transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #404040;
}

.input-wrapper .composer-editor {
  border: none !important;
  outline: none;
}
```

### Composer Root

```css
#composer-root {
  outline: none !important;
}
```

### Input Actions

```css
.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.action-button {
  background: transparent;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button:hover {
  background: #404040;
}

.send-button {
  background: linear-gradient(135deg, #ffd700, #ffb300);
  color: #1e1e1e;
}

.send-button:hover {
  background: linear-gradient(135deg, #ffb300, #ff8f00);
}

.send-button:disabled {
  background: #3c3c3c;
  color: #666;
  cursor: not-allowed;
}
```

### Shortcut Hint

```css
.shortcut-hint {
  font-size: 10px;
  color: #808080;
  text-align: right;
  margin-top: 4px;
}
```

## Composer Module Elements

The composer module also has its own CSS classes:

### Composer Container

```css
.composer {
  display: grid;
  gap: 8px;
}
```

### Toolbar

```css
.toolbar {
  display: flex;
  gap: 6px;
  align-items: center;
}

.toolbar button {
  padding: 4px 8px;
  border: 1px solid var(--vscode-editorWidget-border, #444);
  background: var(--vscode-editorWidget-background, #222);
  cursor: pointer;
}
```

### Composer Editor

```css
.composer-editor {
  width: 100%;
  min-height: 96px;
  resize: vertical;
  padding: 8px;
  border: 1px solid var(--vscode-input-border, #555);
  background: var(--vscode-input-background, #1e1e1e);
  color: var(--vscode-input-foreground, #ddd);
}

.composer-editor:focus {
  border-color: #ffd700;
}
```

### Slash Menu

```css
.slash-menu {
  border: 1px solid var(--vscode-editorWidget-border, #444);
  background: var(--vscode-editorWidget-background, #222);
  max-height: 160px;
  overflow: auto;
  padding: 6px;
}

.slash-menu .active {
  outline: 1px solid var(--vscode-focusBorder, #888);
}
```

### Composer Preview

```css
.composer-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.composer-preview-img {
  max-width: 120px;
  max-height: 120px;
  border: 1px solid var(--vscode-input-border, #555);
  border-radius: 4px;
  object-fit: cover;
}
```
