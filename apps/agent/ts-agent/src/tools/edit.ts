import fs from 'fs/promises';
import path from 'path';
import { BaseAnthropicTool, CLIResult } from './base';
import type { ToolResult } from './base';

/**
 * Tool for editing and reading files
 */
export class EditTool extends BaseAnthropicTool {
  name = 'str_replace_editor';
  description = 'Edit files or view their contents using this tool.';

  async call(params: {
    filename: string;
    old_text?: string;
    new_text?: string;
    operation?: 'read' | 'write'
  }): Promise<ToolResult> {
    const { filename, old_text, new_text, operation = 'read' } = params;

    try {
      if (!filename) {
        return new CLIResult(undefined, 'Filename is required');
      }

      // Normalize the file path
      const filePath = path.resolve(filename);
      
      // Handle read operation
      if (operation === 'read' || (!old_text && !new_text)) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          return new CLIResult(content);
        } catch (err: any) {
          if (err.code === 'ENOENT') {
            return new CLIResult(undefined, `File not found: ${filename}`);
          }
          return new CLIResult(undefined, `Error reading file: ${err.message}`);
        }
      }
      
      // Handle write operation
      if (!old_text && new_text) {
        // Create or overwrite file with new_text
        try {
          // Ensure the directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, new_text, 'utf-8');
          return new CLIResult(`File ${filename} created/overwritten successfully.`);
        } catch (err: any) {
          return new CLIResult(undefined, `Error writing file: ${err.message}`);
        }
      }

      // Handle replace operation
      if (old_text && new_text) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          if (!content.includes(old_text)) {
            return new CLIResult(
              undefined, 
              `Text to replace not found in ${filename}. Current content:\n${content}`
            );
          }
          
          const newContent = content.replace(old_text, new_text);
          await fs.writeFile(filePath, newContent, 'utf-8');
          return new CLIResult(`Text replaced successfully in ${filename}.`);
        } catch (err: any) {
          if (err.code === 'ENOENT') {
            return new CLIResult(undefined, `File not found: ${filename}`);
          }
          return new CLIResult(undefined, `Error editing file: ${err.message}`);
        }
      }

      return new CLIResult(undefined, 'Invalid parameters. Provide filename and either operation="read" or both old_text and new_text.');
    } catch (error: any) {
      return new CLIResult(undefined, `Error in edit tool: ${error.message}`);
    }
  }

  getParameters() {
    return {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Path to the file to edit or read.'
        },
        old_text: {
          type: 'string',
          description: 'Text to replace (for edit operations).'
        },
        new_text: {
          type: 'string',
          description: 'New text to insert (for edit operations).'
        },
        operation: {
          type: 'string',
          enum: ['read', 'write'],
          description: 'Operation to perform: "read" to view file contents, "write" for editing.'
        }
      },
      required: ['filename']
    };
  }
}

/**
 * Create different versions of the edit tool if needed
 */
export class EditTool20241022 extends EditTool {}
export class EditTool20250124 extends EditTool {} 