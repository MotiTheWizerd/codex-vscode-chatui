# Shared Types

- Tools: `src/types/tools.ts`
- Chat/State: `src/types/chat.ts`
- IPC: `src/types/ipc.ts`

Examples:

```ts
import type { Tool, ShellIn, ShellOut } from "@/types/tools";

export class ShellTool implements Tool<ShellIn, ShellOut> { /* ... */ }
```

```ts
import type { ChatSession } from "@/types/chat";
```

```ts
import type { UIToExt, ExtToUI } from "@/types/ipc";
```

