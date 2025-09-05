### 1. 📚 **Always Learn the Codebase First**

```bash
# Before any task, perform these steps:
1. Review the docs/ directory thoroughly
2. Understand the current architecture
3. Map out existing modules and their dependencies
4. Identify affected components before making changes
```

### 2. 🔍 **Use the Codebase Index for Quick Reference**

The `codebase_index/` folder contains pre-generated JSON files that provide comprehensive information about the project structure and content. Use these files to quickly understand the codebase before diving into specific files.

**Available Index Files:**
- `codebase-structure.json` - Complete architectural overview with layers, responsibilities, and file mappings
- `codebase-content.json` - Detailed content analysis of all source files
- `codebase-symbols.json` - Symbol definitions, exports, and dependencies

**When to Use:**
- Before starting any task to understand the overall architecture
- When you need to find specific modules or understand dependencies
- To get a quick overview of file responsibilities and relationships
- When the docs/ directory doesn't have complete information

**How to Use:**
1. Start with `codebase-structure.json` for architectural overview
2. Use `codebase-content.json` to understand specific file contents
3. Reference `codebase-symbols.json` for import/export relationships

**Example Usage:**
```bash
# Quick architectural understanding
cat codebase_index/codebase-structure.json | jq '.architecture.layers'

# Find files by responsibility
cat codebase_index/codebase-structure.json | jq '.architecture.layers[] | select(.name == "core")'
```

# Before any task, perform these steps:

1. Review the docs/ directory thoroughly
2. Understand the current architecture
3. Map out existing modules and their dependencies
4. Identify affected components before making changes

# After completing any task:

1. Create/update documentation in docs/ folder
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

📦 Package Management
We use pnpm as our package manager.
It ensures fast installs with a global content-addressable store.
It provides strict dependency isolation—no accidental hoisting or undeclared imports.
This aligns with our design principles of encapsulation and predictable builds.

👉 Commands are the same shape as npm/yarn (pnpm install, pnpm run build), but lockfile and workspace handling are stricter.

# 🟦 TypeScript

This project is built with **TypeScript**, a strongly typed superset of JavaScript.

It provides:

- **Static typing** → catches errors at compile time.
- **Modern ECMAScript features** → async/await, modules, decorators.
- **Better tooling** → IntelliSense, refactoring, auto-completion.
- **Safer large-scale code** → predictable APIs, fewer runtime bugs.
  We compile TypeScript (`.ts`) into JavaScript (`.js`) before running inside VS Code.

👉 For VS Code extensions, TypeScript is the de-facto standard — the VS Code API itself is typed, so using TypeScript gives you stronger type safety and a smoother development experience.

### — Isolation & Encapsulation

## Why this matters (3 bullets only)

Safety: Isolated modules prevent a bug or secret leak in one place from cascading through the system.
Testability: Encapsulated behavior can be unit-tested with fakes/mocks—no network, no disk, no surprise global state.
Composability: Clear contracts let us swap memory/LLM/tool backends without touching agent logic.

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
