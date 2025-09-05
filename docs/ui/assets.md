# Assets Module

## Overview

The assets module manages static assets used in the chat webview, such as CSS stylesheets, JavaScript files, and HTML fragments. Assets are organized in the `media/chat` directory and are dynamically loaded by the ChatWebview.

## Implementation Status

Implemented. The module handles asset loading, caching, and dynamic refreshing during development.

## Asset Structure

Assets are organized in the `media/chat` directory with the following structure:
- `index.html` - Main HTML template with placeholders for injection
- `styles/` - Directory for CSS stylesheets (optional, in addition to root CSS files)
- `js/` - Directory for JavaScript files (optional, in addition to root JS files)
- `html/` - Directory containing HTML fragments organized in subdirectories:
  - `head/` - Fragments injected into the HTML head
  - `header/` - Fragments injected at the top of the body
  - `messages/` - Fragments injected in the messages section
  - `footer/` - Fragments injected at the bottom of the body

## Features

- Asset loading and caching with automatic versioning for cache busting
- CSS stylesheet management with alphabetical ordering
- JavaScript bundle management with CSP nonce support
- HTML fragment injection with security validation
- Development-time asset watching and auto-refresh

## Design Principles

1. **Efficiency**: Optimizes asset loading and caching with mtime-based versioning
2. **Maintainability**: Organizes assets in a logical directory structure
3. **Security**: Validates HTML fragments to prevent script injection
4. **Development Experience**: Auto-refreshes panel during development when assets change
5. **Flexibility**: Supports both root-level and directory-organized assets