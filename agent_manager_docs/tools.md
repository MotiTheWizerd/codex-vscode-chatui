# Tools

- Module: `src/tools/tool-bus.ts`

## Tool Bus

- Purpose: Registry and invoker for pluggable tools.
- Types: `Tool<I, O>` from `@/types/tools`.

### API

- `register(tool: Tool<unknown, unknown>): void`
- `execute(name: string, args: unknown): Promise<unknown>`
- `getTools(): Tool<unknown, unknown>[]`
- `getTool(name: string): Tool<unknown, unknown> | undefined`

### Example

```ts
import { ToolBus } from "@/tools/tool-bus";
import type { Tool } from "@/types/tools";

const bus = new ToolBus();

const echo: Tool<{ text: string }, { out: string }> = {
  name: 'echo',
  description: 'Echo text',
  parameters: { text: '' },
  async execute(args) { return { out: args.text }; }
};

bus.register(echo);
const result = await bus.execute('echo', { text: 'hi' });
// result => { out: 'hi' }
```

## Notes

- Uses path aliases for imports.
- Logger is optional and can be set via `setLogger` for structured logs.

