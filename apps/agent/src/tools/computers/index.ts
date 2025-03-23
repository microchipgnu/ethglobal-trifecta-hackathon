import type { Tool as AITool } from "ai";
import { OpenAI } from "openai";
import { type ResponseInput, type ResponseInputItem, type Tool } from "openai/resources/responses/responses";
import { z } from "zod";
import { COMPUTER_USE_SYSTEM_PROMPT } from "../../prompts";
import { VNCComputer } from "./vnc";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const useComputer = async (prompt: string): Promise<string> => {
    let computer = null;
    let finalMessage = "";
    let hasError = false;
    
    try {
        console.log('Initializing VNC computer...');
        computer = new VNCComputer("localhost", 5900); // TODO: make this work in the docker network ("computer" host)
        await computer.initialize();
        console.log(`Computer initialized with dimensions: ${computer.dimensions[0]}x${computer.dimensions[1]}`);

        const tools: Array<Tool> = [
            {
                type: 'computer-preview',
                display_width: computer.dimensions[0],
                display_height: computer.dimensions[1],
                // @ts-ignore
                environment: "linux",
            }
        ];

        const items: ResponseInput = [{
            role: "user",
            content: prompt,
        }]

        let continueLoop = true;
        let maxAttempts = 5;
        let attempts = 0;

        while (continueLoop && attempts < maxAttempts) {
            try {
                attempts++;
                const result = await openai.responses.create({
                    model: "computer-use-preview",
                    input: [{
                        role: "system",
                        content: COMPUTER_USE_SYSTEM_PROMPT,
                    }, ...items.filter(item => {
                        // Type-safe check for content property
                        return item.type === 'message' ? item.content !== null && item.content !== undefined : true;
                    })],
                    instructions: COMPUTER_USE_SYSTEM_PROMPT,
                    tools,
                    truncation: "auto",
                });

                // Validate and add output items
                if (result.output && Array.isArray(result.output)) {
                    // Create a mapping of reasoning IDs to items to ensure we keep pairs together
                    const reasoningItems = new Map();
                    const computerCallItems = new Map();
                    const otherValidItems = [];
                    
                    // First pass - categorize items and collect reasoning/call IDs
                    for (const item of result.output) {
                        if (!item) continue;
                        
                        // Store reasoning items by ID
                        if (item.type === 'reasoning') {
                            reasoningItems.set(item.id, item);
                            continue;
                        }
                        
                        // Store computer call items by ID
                        if (item.type === 'computer_call') {
                            computerCallItems.set(item.call_id, item);
                            continue;
                        }
                        
                        // Message from assistant with content
                        if (item.type === 'message' && item.role === 'assistant' && item.content) {
                            otherValidItems.push(item);
                            continue;
                        }
                    }
                    
                    // Create the list of valid outputs, preserving all necessary items
                    const validOutputs = [...otherValidItems];
                    
                    // Add all reasoning and computer call items to maintain the pairs
                    reasoningItems.forEach(item => validOutputs.push(item));
                    computerCallItems.forEach(item => validOutputs.push(item));
                    
                    console.log(`Processing ${validOutputs.length} valid output items`);
                    items.push(...validOutputs);
                }

                console.log(result.output);

                for (const toolCall of result.output) {
                    if (!toolCall || toolCall.type !== "computer_call" || !toolCall.action) {
                        continue;
                    }

                    try {
                        const action = toolCall.action;
                        const actionType = action.type;

                        switch (actionType) {
                            case "click":
                                await computer.click(action.x, action.y, action.button);
                                break;
                            case "double_click":
                                await computer.doubleClick(action.x, action.y);
                                break;
                            case "move":
                                await computer.move(action.x, action.y);
                                break;
                            case "scroll":
                                await computer.scroll(action.x, action.y, action.scroll_x, action.scroll_y);
                                break;
                            case "type":
                                await computer.type(action.text);
                                break;
                            case "wait":
                                await computer.wait();
                                break;
                            case "screenshot":
                                break;
                            case "drag":
                                await computer.drag(action.path);
                                break;
                            case "keypress":
                                await computer.keypress(action.keys);
                                break;
                            default:
                                console.log(`Unknown action type: ${actionType}`);
                                break;
                        }

                        const screenshot = await computer.screenshot();

                        // Ignore pending security checks
                        const callOutput: ResponseInputItem = {
                            type: "computer_call_output",
                            status: "completed",
                            call_id: toolCall.call_id,
                            acknowledged_safety_checks: [],
                            output: {
                                type: "computer_screenshot",
                                image_url: screenshot,
                            }
                        };

                        items.push(callOutput);
                    } catch (error) {
                        const toolError = error as Error;
                        console.error(`Error executing tool action: ${toolError}`);
                        // Create error response for this specific tool call
                        const errorOutput: ResponseInputItem = {
                            type: "computer_call_output",
                            status: "incomplete",
                            call_id: toolCall.call_id,
                            acknowledged_safety_checks: [],
                            output: {
                                type: "computer_screenshot",
                                image_url: "", // Empty image URL to indicate error
                            }
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
                    type: "message",
                    role: "assistant",
                    content: errorMessage
                });
                
                finalMessage = errorMessage;
                
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (attempts >= maxAttempts) {
                    console.log(`Maximum retry attempts (${maxAttempts}) reached, stopping.`);
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
        if (finalMessage === "" && hasError) {
            finalMessage = "An error occurred while using the computer. Please try again.";
        } else if (finalMessage === "") {
            finalMessage = "Computer task completed, but no response was generated.";
        }
        
        return finalMessage;
    }
};

const computerUse: AITool = {
    description: "Use the computer to perform tasks",
    parameters: z.object({
        prompt: z.string(),
    }),
    execute: async ({ prompt }) => {
        try {
            const response = await useComputer(prompt);
            return response;
        } catch (error) {
            console.error('Error executing computerUse tool:', error);
            return `Error: ${(error as Error).message || 'An unknown error occurred'}`;
        }
    },
}

export const getTools = async () => {
    return {
        computerUse
    }
}