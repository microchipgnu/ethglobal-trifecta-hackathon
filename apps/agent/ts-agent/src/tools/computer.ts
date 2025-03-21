import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { BaseAnthropicTool, CLIResult } from './base';
import type { ToolResult } from './base';

const execAsync = promisify(exec);

// Base64 util functions
function isBase64Image(str: string): boolean {
  return /^data:image\/([a-zA-Z]*);base64,([^\"]*)$/.test(str);
}

function extractBase64Data(base64String: string): string {
  const match = base64String.match(/^data:image\/([a-zA-Z]*);base64,([^\"]*)/);
  return match ? match[2] : '';
}

/**
 * Tool for computer interactions like taking screenshots and clicking
 */
export class ComputerTool extends BaseAnthropicTool {
  name = 'computer';
  description = 'Control the computer by taking screenshots, clicking, typing, and more.';

  async call(params: {
    action: string;
    x?: number;
    y?: number;
    text?: string;
    button?: 'left' | 'right';
  }): Promise<ToolResult> {
    const { action, x, y, text, button = 'left' } = params;

    try {
      switch (action) {
        case 'screenshot':
          return await this.takeScreenshot();
        case 'click':
          if (typeof x !== 'number' || typeof y !== 'number') {
            return new CLIResult(undefined, 'x and y coordinates required for click action');
          }
          return await this.mouseClick(x, y, button);
        case 'doubleclick':
          if (typeof x !== 'number' || typeof y !== 'number') {
            return new CLIResult(undefined, 'x and y coordinates required for doubleclick action');
          }
          return await this.mouseDoubleClick(x, y);
        case 'type':
          if (!text) {
            return new CLIResult(undefined, 'text is required for type action');
          }
          return await this.typeText(text);
        default:
          return new CLIResult(undefined, `Unknown action: ${action}`);
      }
    } catch (error: any) {
      return new CLIResult(undefined, `Error in computer tool: ${error.message}`);
    }
  }

  getParameters() {
    return {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action to perform: screenshot, click, doubleclick, type',
          enum: ['screenshot', 'click', 'doubleclick', 'type']
        },
        x: {
          type: 'number',
          description: 'X coordinate for mouse actions'
        },
        y: {
          type: 'number',
          description: 'Y coordinate for mouse actions'
        },
        text: {
          type: 'string',
          description: 'Text to type'
        },
        button: {
          type: 'string',
          description: 'Mouse button to use',
          enum: ['left', 'right']
        }
      },
      required: ['action']
    };
  }

  async takeScreenshot(): Promise<ToolResult> {
    try {
      // Create a temp directory if it doesn't exist
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const screenshotPath = path.join(tempDir, `screenshot-${Date.now()}.png`);
      
      // Take screenshot using xwd or scrot (Linux) or screencapture (macOS)
      const platform = process.platform;
      
      if (platform === 'darwin') {
        await execAsync(`screencapture -x ${screenshotPath}`);
      } else if (platform === 'linux') {
        await execAsync(`DISPLAY=:1 scrot ${screenshotPath}`);
      } else {
        return new CLIResult(undefined, `Screenshots not supported on ${platform}`);
      }
      
      // Read the screenshot and convert to base64
      const data = await fs.readFile(screenshotPath);
      const base64Image = `data:image/png;base64,${data.toString('base64')}`;
      
      // Clean up the file
      await fs.unlink(screenshotPath);
      
      return new CLIResult(undefined, undefined, base64Image);
    } catch (error: any) {
      return new CLIResult(undefined, `Screenshot error: ${error.message}`);
    }
  }

  async mouseClick(x: number, y: number, button: 'left' | 'right'): Promise<ToolResult> {
    try {
      const platform = process.platform;
      
      if (platform === 'linux') {
        // Use xdotool for Linux
        const buttonMap = { left: 1, right: 3 };
        const buttonNum = buttonMap[button];
        await execAsync(`DISPLAY=:1 xdotool mousemove ${x} ${y} click ${buttonNum}`);
        return new CLIResult(`Clicked ${button} button at ${x},${y}`);
      } else if (platform === 'darwin') {
        // For macOS, use AppleScript
        const script = button === 'left' 
          ? `osascript -e 'tell application "System Events" to click at {${x}, ${y}}'`
          : `osascript -e 'tell application "System Events" to secondary click at {${x}, ${y}}'`;
        
        await execAsync(script);
        return new CLIResult(`Clicked ${button} button at ${x},${y}`);
      } else {
        return new CLIResult(undefined, `Mouse clicks not supported on ${platform}`);
      }
    } catch (error: any) {
      return new CLIResult(undefined, `Mouse click error: ${error.message}`);
    }
  }

  async mouseDoubleClick(x: number, y: number): Promise<ToolResult> {
    try {
      const platform = process.platform;
      
      if (platform === 'linux') {
        // Use xdotool for Linux
        await execAsync(`DISPLAY=:1 xdotool mousemove ${x} ${y} click --repeat 2 1`);
        return new CLIResult(`Double-clicked at ${x},${y}`);
      } else if (platform === 'darwin') {
        // For macOS, use AppleScript
        await execAsync(`osascript -e 'tell application "System Events" to click at {${x}, ${y}} click at {${x}, ${y}}'`);
        return new CLIResult(`Double-clicked at ${x},${y}`);
      } else {
        return new CLIResult(undefined, `Mouse double-clicks not supported on ${platform}`);
      }
    } catch (error: any) {
      return new CLIResult(undefined, `Mouse double-click error: ${error.message}`);
    }
  }

  async typeText(text: string): Promise<ToolResult> {
    try {
      const platform = process.platform;
      const escapedText = text.replace(/['"]/g, '\\"');
      
      if (platform === 'linux') {
        // Use xdotool for Linux
        await execAsync(`DISPLAY=:1 xdotool type "${escapedText}"`);
        return new CLIResult(`Typed: ${text}`);
      } else if (platform === 'darwin') {
        // For macOS, use AppleScript
        await execAsync(`osascript -e 'tell application "System Events" to keystroke "${escapedText}"'`);
        return new CLIResult(`Typed: ${text}`);
      } else {
        return new CLIResult(undefined, `Typing not supported on ${platform}`);
      }
    } catch (error: any) {
      return new CLIResult(undefined, `Typing error: ${error.message}`);
    }
  }
}

/**
 * Create different versions of the computer tool if needed
 */
export class ComputerTool20241022 extends ComputerTool {}
export class ComputerTool20250124 extends ComputerTool {} 