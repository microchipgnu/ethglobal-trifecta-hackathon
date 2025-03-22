
import type { Tool as AITool } from "ai";
import { OpenAI } from "openai";
import { type ResponseInput, type ResponseInputItem, type Tool } from "openai/resources/responses/responses";
import { z } from "zod";
import { COMPUTER_USE_SYSTEM_PROMPT } from "../../prompts";
import { VNCComputer } from "./vnc";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const useComputer = async (prompt: string) => {
    console.log('Initializing VNC computer...');
    const computer = new VNCComputer("localhost", 5900); // TODO: make this work in the docker network ("computer" host)
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

    while (true) {

        const result = await openai.responses.create({
            model: "computer-use-preview",
            input: [{
                role: "system",
                content: COMPUTER_USE_SYSTEM_PROMPT,
            }, ...items],
            instructions: COMPUTER_USE_SYSTEM_PROMPT,
            tools,
            truncation: "auto",
        })

        items.push(...result.output)

        console.log(result.output)

        for (const toolCall of result.output) {
            if (toolCall.type === "computer_call") {
                const action = toolCall.action
                const actionType = action.type

                switch (actionType) {
                    case "click":
                        await computer.click(action.x, action.y, action.button)
                        break;
                    case "double_click":
                        await computer.doubleClick(action.x, action.y)
                        break;
                    case "move":
                        await computer.move(action.x, action.y)
                        break;
                    case "scroll":
                        await computer.scroll(action.x, action.y, action.scroll_x, action.scroll_y)
                        break;
                    case "type":
                        await computer.type(action.text)
                        break;
                    case "wait":
                        await computer.wait()
                        break;
                    case "screenshot":
                        break;
                    case "drag":
                        await computer.drag(action.path)
                        break;
                    case "keypress":
                        await computer.keypress(action.keys)
                        break;
                    default:
                        break;
                }

                const screenshot = await computer.screenshot()

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
                }

                items.push(callOutput)
            }
        }
    }

};

const computerUse: AITool = {
    description: "Use the computer to perform tasks",
    parameters: z.object({
        prompt: z.string(),
    }),
    execute: async ({ prompt }) => {
        await useComputer(prompt)
    }
}

export const getTools = async () => {
    return [computerUse]
}