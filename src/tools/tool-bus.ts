// Tool bus for plugin API
// This file manages tool registration and execution

import { Logger } from "@/telemetry/logger.js";

export interface Tool {
  name: string;
  description: string;
  parameters: any;
  execute: (args: any) => Promise<any>;
}

export class ToolBus {
  private tools: Map<string, Tool> = new Map();
  private logger: Logger | null = null;

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  // Register a tool
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
    this.logger?.info(`Tool registered: ${tool.name}`);
  }

  // Execute a tool by name
  async execute(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      const error = new Error(`Tool ${name} not found`);
      this.logger?.error(`Tool execution failed: ${name}`, { error });
      throw error;
    }
    
    this.logger?.info(`Executing tool: ${name}`, { args });
    return await tool.execute(args);
  }

  // Get all registered tools
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  // Get a tool by name
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
}