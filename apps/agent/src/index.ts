import { generateObject, generateText } from "ai"
import { getTools as getAgentkitTools } from "./tools/agentkit"
import { getTools as getComputerTools } from "./tools/computers"
import { getTools as getToolhouseTools } from "./tools/toolhouse"
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import redisClient from "./db/redis";
import { CLASSIFICATION_PROMPT } from "./prompts";
import { setAgentState } from "./state/agent";
import { setLastUsedTool } from "./state/tools";

export const executePrompt = async (prompt: string) => {
    const agentkitTools = await getAgentkitTools();
    const computerTools = await getComputerTools();
    const toolhouseTools = await getToolhouseTools();

    redisClient.append("messages", {
        role: "user",
        content: prompt,
    });

    await setAgentState({
        state: "received_prompt",
        model: "gpt-4o",
        provider: "openai",
        message: `Received prompt: ${prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt}`,
        timestamp: new Date().toISOString(),
    });

    // classify the prompt
    const { object: classification } = await generateObject({
        model: openai("gpt-4o"),
        schema: z.object({
          reasoning: z.string(),
          type: z.enum(['crypto', 'general', 'computer']),
        }),
        prompt: CLASSIFICATION_PROMPT(prompt),
    });

    console.log(classification);

    await setAgentState({
        state: "prompt_classified",
        model: "gpt-4o",
        provider: "openai",
        message: `Classified prompt as ${classification.type}`,
        timestamp: new Date().toISOString(),
    });

    const queryType = classification.type;
    const toolsToUse = queryType === 'crypto' ? agentkitTools : queryType === 'computer' ? computerTools : toolhouseTools;

    await setAgentState({
        state: "tools_selected",
        model: "gpt-4o",
        provider: "openai",
        message: `Loading ${queryType} tools...`,
        timestamp: new Date().toISOString(),
    });

    const result = await generateText({
        model: openai("gpt-4o"),
        system: "",
        prompt: prompt,
        tools: toolsToUse,
        maxSteps: 10,
        maxRetries: 3,
    })

    for (const toolCall of result.toolCalls) {  
        await setLastUsedTool(toolCall.toolName);
        setAgentState({
            state: "tool_used",
            model: "gpt-4o",
            provider: "openai",
            message: `Used tool: ${toolCall.toolName}`,
            timestamp: new Date().toISOString(),
        });

        // Sleep for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    redisClient.set("agent_message", result.text);

    await setAgentState({
        state: "idle",
        model: "gpt-4o",
        provider: "openai",
        message: "Idle",
        timestamp: new Date().toISOString(),
    });

    redisClient.append("messages", {
        role: "assistant",
        content: result.text,
    });

    return result;
}