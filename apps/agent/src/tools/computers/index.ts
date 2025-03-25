import type { Tool as AITool } from 'ai';
import { OpenAI } from 'openai';
import {
  type ResponseInput,
  type ResponseInputItem,
  type Tool,
} from 'openai/resources/responses/responses';
import { z } from 'zod';
import { COMPUTER_USE_SYSTEM_PROMPT } from '../../prompts';
import { VNCComputer } from './vnc';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const useComputer = async (
  prompt: string,
  { host, port }: { host: string; port: number }
): Promise<string> => {
  let computer = null;
  let finalMessage = '';
  let hasError = false;

  try {
    console.log('Initializing VNC computer...');
    computer = new VNCComputer(host, port);
    await computer.initialize();
    console.log(
      `Computer initialized with dimensions: ${computer.dimensions[0]}x${computer.dimensions[1]}`
    );

    const tools: Array<Tool> = [
      {
        type: 'computer-preview',
        display_width: computer.dimensions[0],
        display_height: computer.dimensions[1],
        // @ts-ignore
        environment: 'linux',
      },
    ];

    const items: ResponseInput = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    let continueLoop = true;
    const maxAttempts = 100;
    let attempts = 0;

    while (continueLoop && attempts < maxAttempts) {
      try {
        attempts++;
        const result = await openai.responses.create({
          model: 'computer-use-preview',
          input: [
            {
              role: 'system',
              content: COMPUTER_USE_SYSTEM_PROMPT,
            },
            ...items,
          ],
          instructions: COMPUTER_USE_SYSTEM_PROMPT,
          tools,
          truncation: 'auto',
        });

        // Store message-reasoning pairs by reasoning ID
        const messagePairs = new Map();
        const computerCallItems = [];
        const otherItems = [];

        // First pass - find and pair reasoning items with their messages
        if (result.output && Array.isArray(result.output)) {
          // Create mapping from reasoning ID to reasoning item first
          const reasoningMap = new Map();
          for (const item of result.output) {
            if (!item) continue;
            if (item.type === 'reasoning') {
              reasoningMap.set(item.id, item);
            }
          }

          // Process all items
          for (const item of result.output) {
            if (!item) continue;

            if (item.type === 'computer_call') {
              computerCallItems.push(item);
            } else if (item.type === 'message' && item.role === 'assistant') {
              // For each message, find its associated reasoning
              // Use type assertion to access reasoning_id safely
              const itemAny = item as any;
              const reasoningId = itemAny.reasoning_id || '';
              const reasoningItem = reasoningMap.get(reasoningId);

              // Store both together
              if (reasoningItem) {
                messagePairs.set(reasoningId, {
                  message: item,
                  reasoning: reasoningItem,
                });
              } else {
                otherItems.push(item);
              }
            } else {
              otherItems.push(item);
            }
          }
        }

        // Add items in the correct order to maintain relationships
        const validOutputs = [...otherItems];

        // Add reasoning items first, then their messages
        messagePairs.forEach((pair) => {
          validOutputs.push(pair.reasoning);
          validOutputs.push(pair.message);
        });

        // Add computer calls correctly by adding them directly to items
        // instead of validOutputs to avoid type mismatch
        console.log(
          `Processing ${validOutputs.length} valid output items and ${computerCallItems.length} computer calls`
        );

        // Add all valid outputs to items
        items.push(...validOutputs);

        // Add computer calls separately to avoid type issues
        computerCallItems.forEach((call) => items.push(call));

        console.log(result.output);

        for (const toolCall of result.output) {
          if (
            !toolCall ||
            toolCall.type !== 'computer_call' ||
            !toolCall.action
          ) {
            continue;
          }

          try {
            // First, extract safety check ID directly if possible - we need this to avoid errors
            const pendingSafetyChecks = toolCall.pending_safety_checks || [];
            console.log(
              'Pending safety checks:',
              JSON.stringify(pendingSafetyChecks, null, 2)
            );

            // Keep the original safety check objects - the API expects the full objects, not just IDs
            // API error: "expected an object, but got a string instead"

            console.log(
              `Acknowledging ${pendingSafetyChecks.length} safety checks for call ${toolCall.call_id}`
            );

            const action = toolCall.action;
            const actionType = action.type;

            switch (actionType) {
              case 'click':
                await computer.click(action.x, action.y, action.button);
                break;
              case 'double_click':
                await computer.doubleClick(action.x, action.y);
                break;
              case 'move':
                await computer.move(action.x, action.y);
                break;
              case 'scroll':
                await computer.scroll(
                  action.x,
                  action.y,
                  action.scroll_x,
                  action.scroll_y
                );
                break;
              case 'type':
                await computer.type(action.text);
                break;
              case 'wait':
                await computer.wait();
                break;
              case 'screenshot':
                break;
              case 'drag':
                await computer.drag(action.path);
                break;
              case 'keypress':
                await computer.keypress(action.keys);
                break;
              default:
                console.log(`Unknown action type: ${actionType}`);
                break;
            }

            const screenshot = await computer.screenshot();

            // Pass the complete pending safety check objects as-is to acknowledge them
            const callOutput: ResponseInputItem = {
              type: 'computer_call_output',
              status: 'completed',
              call_id: toolCall.call_id,
              acknowledged_safety_checks: pendingSafetyChecks,
              output: {
                type: 'computer_screenshot',
                image_url: screenshot,
              },
            };

            items.push(callOutput);
          } catch (error) {
            const toolError = error as Error;
            console.error(`Error executing tool action: ${toolError}`);
            // Create error response for this specific tool call
            const errorOutput: ResponseInputItem = {
              type: 'computer_call_output',
              status: 'incomplete',
              call_id: toolCall.call_id,
              acknowledged_safety_checks: [],
              output: {
                type: 'computer_screenshot',
                image_url: '', // Empty image URL to indicate error
              },
            };
            items.push(errorOutput);
          }
        }

        const lastItem = items[items.length - 1];
        // If we got a final response, break the inner loop
        if (lastItem?.type === 'message') {
          if (lastItem.role === 'assistant') {
            continueLoop = false;
            // Store the final message content
            if (lastItem.content) {
              finalMessage = lastItem.content as string;
            }
          }
        }
      } catch (error) {
        const loopError = error as Error;
        console.error(`Error in processing loop: ${loopError}`);
        hasError = true;

        // Add error message to items
        const errorMessage = `An error occurred: ${loopError.message || 'Unknown error'}. Please try again.`;
        items.push({
          type: 'message',
          role: 'assistant',
          content: errorMessage,
        });

        finalMessage = errorMessage;

        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (attempts >= maxAttempts) {
          console.log(
            `Maximum retry attempts (${maxAttempts}) reached, stopping.`
          );
          continueLoop = false;
        }
      }
    }
  } catch (error) {
    console.error('Error in useComputer:', error);
    hasError = true;
    finalMessage = `Error: ${(error as Error).message || 'An unknown error occurred while using the computer'}`;
  } finally {
    // Ensure the computer connection is closed properly
    if (computer) {
      try {
        await computer.close();
        console.log('VNC connection closed successfully');
      } catch (closeError) {
        console.error('Error closing VNC connection:', closeError);
        if (!hasError) {
          finalMessage = `Error closing VNC connection: ${(closeError as Error).message}`;
          hasError = true;
        }
      }
    }

    // If we had no final message but had an error, provide a generic error message
    if (finalMessage === '' && hasError) {
      finalMessage =
        'An error occurred while using the computer. Please try again.';
    } else if (finalMessage === '') {
      finalMessage = 'Computer task completed, but no response was generated.';
    }
    return finalMessage;
  }
};

const computerUse = ({
  host,
  port,
}: { host: string; port: number }): AITool => {
  return {
    description: 'Use the computer to perform tasks',
    parameters: z.object({
      prompt: z.string(),
    }),
    execute: async ({ prompt }) => {
      try {
        const response = await useComputer(prompt, { host, port });
        return response;
      } catch (error) {
        console.error('Error executing computerUse tool:', error);
        return `Error: ${(error as Error).message || 'An unknown error occurred'}`;
      }
    },
  };
};

export const getTools = async ({
  host,
  port,
}: { host: string; port: number }) => {
  return {
    computerUse: computerUse({ host, port }),
  };
};
