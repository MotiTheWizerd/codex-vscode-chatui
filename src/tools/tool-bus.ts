// Tool bus for plugin API
// This file manages tool registration and execution

export interface Tool {
  name: string;
  description: string;
  parameters: any;
  execute: (args: any) => Promise<any>;
}

export class ToolBus {
  private tools: Map<string, Tool> = new Map();

  // Register a tool
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  // Execute a tool by name
  async execute(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    
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