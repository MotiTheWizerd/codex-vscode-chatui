Files Service (Stage 2)

- Module: `src/files/service.ts`
- Exposes an in‑memory index of workspace files for UI features.

Responsibilities

- Index files via `workspace.findFiles` with built‑in ignores (git, node_modules, dist, etc.).
- Update index via `FileSystemWatcher`.
- Provide `indexSlice(limit)`, `search(q, limit)`, `listChildren(path, limit)`, `stat(path)`.
- No file content reads; metadata only.

Bridge API

- Webview → Extension:
  - `files/index { limit, reqId }`
  - `files/search { q, limit, reqId }`
  - `files/listChildren { path, limit, reqId }`
  - `files/stat { path, reqId }`
- Extension → Webview:
  - `files/result { op, items, cursor, meta, reqId }`

Integration

- Registered in DI by `CoreManager` as `filesService`.
- `ChatWebview` handles bridge messages and replies with `files/result`.
- Mentions controller swaps mock for bridge calls with debounced, cancellable requests.

Notes

- Default ignore set is built‑in; .gitignore support can be added later via pattern parsing.
- Paths are workspace‑relative with forward slashes.
