import { BaseAnthropicTool } from './base';
import type { ToolParam } from './base';

/**
 * Collection of tools for the agent to use
 */
export class ToolCollection {
  private tools: Map<string, BaseAnthropicTool> = new Map();

  constructor(tools: BaseAnthropicTool[] = []) {
    for (const tool of tools) {
      this.tools.set(tool.name, tool);
    }
  }

  add(tool: BaseAnthropicTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): BaseAnthropicTool | undefined {
    return this.tools.get(name);
  }

  async call(name: string, params: Record<string, any>) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.call(params);
  }

  toParams(): ToolParam[] {
    return Array.from(this.tools.values()).map(tool => tool.toParams());
  }

  getAllTools(): BaseAnthropicTool[] {
    return Array.from(this.tools.values());
  }
} 