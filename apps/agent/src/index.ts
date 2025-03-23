import { generateObject, generateText } from "ai"
import { getTools as getAgentkitTools } from "./tools/agentkit"
import { getTools as getComputerTools } from "./tools/computers"
import { getTools as getToolhouseTools } from "./tools/toolhouse"
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const executePrompt = async (prompt: string) => {
    const agentkitTools = await getAgentkitTools();
    const computerTools = await getComputerTools();
    const toolhouseTools = await getToolhouseTools();


    // classify the prompt
    const { object: classification } = await generateObject({
        model: openai("gpt-4o"),
        schema: z.object({
          reasoning: z.string(),
          type: z.enum(['crypto', 'general', 'computer']),
        }),
        prompt: `Classify this user query:

        ${prompt}
    
        Determine:
        1. Query type (crypto, general, or needs to use a computer)
      `,
    });

    const queryType = classification.type;
    const toolsToUse = queryType === 'crypto' ? agentkitTools : queryType === 'computer' ? computerTools : toolhouseTools;

    const result = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
        tools: toolsToUse,
        maxSteps: 10,
        maxRetries: 3,
    })

    return result;
}

import * as readline from 'readline';

const main = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = () => {
        return new Promise<string>((resolve) => {
            rl.question('Enter your prompt (or type "exit" to quit): ', (answer) => {
                resolve(answer);
            });
        });
    };

    console.log('Welcome to the AI Assistant. Type your questions and press Enter.');
    
    while (true) {
        const prompt = await askQuestion();
        
        if (prompt.toLowerCase() === 'exit') {
            console.log('Goodbye!');
            rl.close();
            break;
        }
        
        console.log('Processing your request...');
        const result = await executePrompt(prompt);
        console.log('\nResponse:');
        console.log(result.text);
        console.log('\n-------------------\n');
    }
};

await main();