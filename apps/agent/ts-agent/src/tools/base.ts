/**
 * Base types and interfaces for the agent tool system
 */

export interface ToolParam {
  type: string;
  function?: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface ToolResult {
  output?: string;
  error?: string;
  base64_image?: string;
  system?: string;
}

export class CLIResult implements ToolResult {
  constructor(
    public output?: string,
    public error?: string,
    public base64_image?: string,
    public system?: string
  ) {}

  static fromObject(obj: ToolResult): CLIResult {
    return new CLIResult(obj.output, obj.error, obj.base64_image, obj.system);
  }

  combine(other: ToolResult): CLIResult {
    return new CLIResult(
      this.output && other.output ? this.output + other.output : this.output || other.output,
      this.error && other.error ? this.error + other.error : this.error || other.error,
      this.base64_image || other.base64_image,
      this.system && other.system ? this.system + other.system : this.system || other.system
    );
  }
}

export abstract class BaseAnthropicTool {
  abstract name: string;
  abstract description: string;

  abstract call(params: Record<string, any>): Promise<ToolResult>;

  toParams(): ToolParam {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: this.getParameters()
      }
    };
  }

  abstract getParameters(): {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
} 