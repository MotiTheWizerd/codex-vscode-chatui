export interface Tool<I, O> {
  name: string;
  description: string;
  parameters: I;
  execute(args: I): Promise<O>;
}

export interface ShellIn { command: string }
export interface ShellOut { stdout: string; stderr: string; exitCode: number }

