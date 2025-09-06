# Files Service

Module: `src/files/service.ts`
Exposes an in-memory index of workspace files for UI features.

## Overview

The FilesService provides an in-memory index of workspace files for UI features like file mentions. It handles file indexing, searching, and metadata operations without reading file contents. The service is composed of multiple specialized sub-services for different functionalities.

## Responsibilities

- Index files via `workspace.findFiles` with built-in ignores (git, node_modules, dist, etc.)
- Update index via `FileSystemWatcher`
- Provide `indexSlice(limit)`, `search(q, limit)`, `listChildren(path, limit)`, `stat(path)`, `resolveDrop(inputs, limit)`
- No file content reads; metadata only
- Handle drag and drop file resolution

## Architecture

The FilesService delegates to specialized sub-services:
- `IndexingService`: Handles file indexing and watching
- `SearchService`: Handles file search operations
- `DirectoryService`: Handles directory listing operations
- `FileOperationsService`: Handles file stat and drop resolution operations

## Methods

### async initialize(): Promise<void>

Initialize the files service by starting background index build and setting up file system watchers.

### async refreshIndex(): Promise<void>

Manually refresh the file index.

### summary()

Get a summary of the current index state including count and completion status.

### indexSlice(limit = 200): FileEntry[]

Get a slice of the indexed files up to the specified limit.

### search(query: string, limit = 50): FileEntry[]

Search for files matching the query string. Returns matching files and parent directories, sorted with directories first.

### listChildren(path: string, limit = 200): FileEntry[]

List children of a specific directory path.

### async stat(path: string): Promise<FileEntry | null>

Get metadata for a specific file or directory path.

### async resolveDrop(inputs: string[], limit = 200): Promise<{ items: FileEntry[]; truncated: boolean; bad: string[] }>

Resolve dropped file paths into FileEntry objects.

## Bridge API

### Webview → Extension:
- `files/index { limit, reqId }`
- `files/search { q, limit, reqId }`
- `files/listChildren { path, limit, reqId }`
- `files/stat { path, reqId }`
- `files/resolveDrop { items, limit, reqId }`

### Extension → Webview:
- `files/result { op, items, cursor, meta, reqId }`

## Integration

- Registered in DI by `CoreManager` as `filesService`
- `ChatWebview` and `ChatViewProvider` handle bridge messages and replies with `files/result`
- Mentions controller swaps mock for bridge calls with debounced, cancellable requests

## Notes

- Default ignore set is built-in; .gitignore support can be added later via pattern parsing
- Paths are workspace-relative with forward slashes
- `search(q, limit)` returns matching files and also includes parent directories of those matches. Results are sorted with directories first, then files (alphabetical by name)
- The service automatically watches for file system changes and updates the index accordingly
- Drag and drop functionality is supported through the `resolveDrop` method

## Dependencies

- VS Code Extension Context for file system access
- Logger for debugging and error reporting