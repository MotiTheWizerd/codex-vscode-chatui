### 1. 📚 **Always Learn the Codebase First**

```bash
# Before any task, perform these steps:
1. Review the docs/ directory thoroughly
2. Understand the current architecture
3. Map out existing modules and their dependencies
4. Identify affected components before making changes
```

# Before any task, perform these steps:

1. Review the agent_manager_docs/ directory thoroughly
2. Understand the current architecture
3. Map out existing modules and their dependencies
4. Identify affected components before making changes

# After completing any task:

1. Create/update documentation in agent_manager_docs/ folder
2. Document the current working structure of modified modules
3. Include working examples and API endpoints
4. Exclude e/rror logs - focus on final working state only
5. Update feature overview and dependencies

# Import Rules

When writing imports in this project, follow these rules:

- **Always use path aliases (never `../` relative paths).**
- Aliases are defined in `tsconfig.json`:

```jsonc
"baseUrl": "./src",
"paths": {
  "@/*": ["*"],
  "@core/*": ["core/*"],
  "@core-manager": ["core/manager"]
}
```

## Usage

- `@/…` → import from project root (`src/`)
  ```ts
  import { ChatWebview } from "@/ui/chat-webview";
  ```
- `@core/…` → import from the `core/` folder
  ```ts
  import { EventBus } from "@core/event-bus";
  ```
- `@core-manager` → import specifically `core/manager.ts`
  ```ts
  import { CoreManager } from "@core-manager";
  ```

### ❌ Don’t

```ts
import { CoreManager } from "../../core/manager"; // avoid
import { EventBus } from "/core/event-bus"; // avoid
```

# 🟦 TypeScript

This project is built with **TypeScript**, a strongly typed superset of JavaScript.

It provides:

- **Static typing** → catches errors at compile time.
- **Modern ECMAScript features** → async/await, modules, decorators.
- **Better tooling** → IntelliSense, refactoring, auto-completion.
- **Safer large-scale code** → predictable APIs, fewer runtime bugs.

We compile TypeScript (`.ts`) into JavaScript (`.js`) before running inside VS Code.

👉 For VS Code extensions, TypeScript is the de-facto standard — the VS Code API itself is typed, so using TypeScript gives you stronger type safety and a smoother development experience.

### Documentation Instructions

## Goal: Generate project docs from the leaf modules up so higher layers plug into already-defined contracts.

# 📐 Visual Map (Bottom → Top)

Leaf (document first)
┌─ config/
│ ├─ settings.ts
│ └─ secrets.ts
├─ telemetry/
│ ├─ logger.ts
│ ├─ metrics.ts
│ └─ reporter.ts
├─ state/
│ ├─ session-store.ts
│ └─ migrations.ts
├─ tools/
│ ├─ tool-bus.ts
│ └─ shell-tool.ts
├─ transport/
│ ├─ client.ts
│ ├─ ws-handler.ts
│ └─ types.ts
├─ ui/
│ ├─ chat-webview.ts
│ ├─ renderer.ts
│ └─ assets/
├─ core/
│ ├─ manager.ts
│ ├─ event-bus.ts
│ ├─ policy.ts
│ ├─ di.ts
│ └─ errors.ts
└─ ext/
└─ extension.ts
Top (document last)

# ✅ Order of Work

config/ → settings.ts, secrets.ts
telemetry/ → logger.ts, metrics.ts, reporter.ts
state/ → session-store.ts, migrations.ts
tools/ → tool-bus.ts, shell-tool.ts (stub)
transport/ → client.ts, ws-handler.ts, types.ts
ui/ → chat-webview.ts, renderer.ts, assets/
core/ → manager.ts, event-bus.ts, policy.ts, di.ts, errors.ts
ext/ → extension.ts (activation flow & commands)
flows & top-level → Activation, Send/Stream, Tool Call, Persistence; update README.md
🏷️ Paths

Per-module docs: docs/<module>/<file>.md
Overview docs:
docs/architecture.md
docs/development.md
README.md
