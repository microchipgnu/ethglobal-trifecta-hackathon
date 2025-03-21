import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseAnthropicTool, CLIResult } from './base';
import type { ToolResult } from './base';

const execAsync = promisify(exec);

/**
 * Tool for executing bash commands
 */
export class BashTool extends BaseAnthropicTool {
  name = 'bash';
  description = 'Execute shell commands using bash. Use this tool to run commands in the Linux environment.';

  async call({ command }: { command: string }): Promise<ToolResult> {
    try {
      console.log(`Executing bash command: ${command}`);
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      return new CLIResult(
        stdout || undefined,
        stderr || undefined
      );
    } catch (error: any) {
      console.error(`Bash command error: ${error.message}`);
      return new CLIResult(
        undefined,
        error.message || 'Unknown error executing bash command'
      );
    }
  }

  getParameters() {
    return {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute.'
        }
      },
      required: ['command']
    };
  }
}

/**
 * Create different versions of the bash tool if needed
 */
export class BashTool20241022 extends BashTool {}
export class BashTool20250124 extends BashTool {} 