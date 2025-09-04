# State

- Modules: `src/state/migrations.ts`, `src/state/session-store.ts`

## Migrations (`migrations.ts`)

- Purpose: Applies schema upgrades to persisted workspace state.
- Manager: `MigrationManager` with `register`, `applyMigrations`, `getLatestVersion`.
- Data shape: `PersistedState` with `sessions: Record<string, PersistedChatSession>` and `currentSessionId: string | null`.
- Safety: Guards added for `noUncheckedIndexedAccess` when iterating `sessions`.

### Usage

```ts
import { migrationManager } from "@/state/migrations";

// Register custom migrations elsewhere if needed
// migrationManager.register({ version, description, up, down })

// Apply on load (example)
const latest = migrationManager.getLatestVersion();
state = migrationManager.applyMigrations(currentVersion, latest, state);
```

## Session Store (`session-store.ts`)

- Purpose: Persists `ChatSession`s to VS Code `workspaceState`.
- API:
  - `createSession(): Promise<ChatSession>`
  - `getCurrentSession(): ChatSession | null`
  - `addMessageToCurrentSession(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage>`
  - `getSessions(): ChatSession[]`
  - `clearCurrentSession(): Promise<void>`
  - `dispose(): Promise<void>`
- Storage keys: `codex.sessions`, `codex.currentSessionId`.

### Example

```ts
import { SessionStore } from "@/state/session-store";
import { Logger } from "@/telemetry/logger.js";

const store = new SessionStore(context, new Logger());
await store.createSession();
await store.addMessageToCurrentSession({ role: 'user', content: 'Hello' });
```

## Types

- `@/types/chat`: `ChatMessage`, `ChatSession`, `PersistedChatMessage`, `PersistedChatSession`, `PersistedState`.

## Notes

- Imports follow path aliases defined in `tsconfig.json`.
- `noUncheckedIndexedAccess` is enabled; code checks for undefined when indexing records.

