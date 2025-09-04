// Tool bus for plugin API
// This file manages tool registration and execution

import { Logger } from "@/telemetry/logger.js";
import type { Tool } from "@/types/tools";
import { serializeErr } from "@/telemetry/err";

export class ToolBus {
  private tools: Map<string, Tool<unknown, unknown>> = new Map();
  private logger: Logger | null = null;

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  // Register a tool
  register(tool: Tool<unknown, unknown>): void {
    this.tools.set(tool.name, tool);
    this.logger?.info(`Tool registered: ${tool.name}`);
  }

  // Execute a tool by name
  async execute(name: string, args: unknown): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      const error = new Error(`Tool ${name} not found`);
      this.logger?.error(`Tool execution failed: ${name}`, { err: serializeErr(error) });
      throw error;
    }
    
    this.logger?.info(`Executing tool: ${name}`, { args });
    return await (tool as Tool<unknown, unknown>).execute(args);
  }

  // Get all registered tools
  getTools(): Tool<unknown, unknown>[] {
    return Array.from(this.tools.values());
  }

  // Get a tool by name
  getTool(name: string): Tool<unknown, unknown> | undefined {
    return this.tools.get(name);
  }
}
