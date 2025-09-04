// Shell tool stub
// This file implements a stub for shell command execution

import type { Tool, ShellIn, ShellOut } from "@/types/tools";
import { Logger } from "@/telemetry/logger.js";

export class ShellTool implements Tool<ShellIn, ShellOut> {
  name = "shell";
  description = "Execute shell commands";
  parameters!: ShellIn;
  private logger: Logger | null = null;

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  async execute(args: ShellIn): Promise<ShellOut> {
    // For MVP, we'll just return a stub response
    // In a full implementation, this would execute the actual shell command
    this.logger?.info(`ShellTool: Executing command "${args.command}"`);

    // Simulate command execution
    return {
      stdout: `Executed: ${args.command}\nThis is a simulated response from the shell tool.`,
      stderr: "",
      exitCode: 0,
    };
  }
}
