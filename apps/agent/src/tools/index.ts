import { getTools as getGoatTools } from "./goat";
import { getTools as getAgentkitTools } from "./agentkit";
import { getTools as getComputerTools } from "./computers";
import { getTools as getToolhouseTools } from "./toolhouse";

import type { ToolSet } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const getToolsGroup = async (group: string): Promise<ToolSet> => {
    switch (group) {
        case "crypto": {
            const goatTools = await getGoatTools();
            const agentkitTools = await getAgentkitTools();
            // Convert to ToolSet to fix type compatibility issues
            const combinedTools: ToolSet = {};
            
            // Add tools from goatTools
            for (const [key, tool] of Object.entries(goatTools)) {
                combinedTools[key] = tool as any;
            }
            
            // Add tools from agentkitTools
            for (const [key, tool] of Object.entries(agentkitTools)) {
                combinedTools[key] = tool as any;
            }
            
            return combinedTools;
        }
        case "computer":
            return await getComputerTools({ host: "localhost", port: 5900 }) as ToolSet;
        case "general":
            return await getToolhouseTools() as ToolSet;
        default:
            throw new Error(`Invalid group: ${group}`);
    }
}

export const selectTools = async (prompt: string, group: string | undefined, maxTools: number = 5): Promise<ToolSet> => {
    // Default to 'general' if no group is specified
    const safeGroup = group || 'general';
    
    // Get all tools for the group
    const allTools = await getToolsGroup(safeGroup);
    
    // If we have fewer tools than maxTools, return all tools
    if (Object.keys(allTools).length <= maxTools) {
        return allTools;
    }
    
    // Get tool descriptions for AI to understand them
    const toolDescriptions = Object.entries(allTools).map(([name, tool]) => ({
        name,
        description: tool.description || "No description available"
    }));
    
    // Use AI to select the most relevant tools
    const { object: selectedTools } = await generateObject({
        model: openai("gpt-4o"),
        schema: z.object({
            reasoning: z.string(),
            tools: z.array(z.string()).max(maxTools),
        }),
        prompt: `
            Based on the user request: "${prompt}"
            
            Select up to ${maxTools} of the most relevant tools to complete this request.
            Available tools:
            ${toolDescriptions.map(t => `- ${t.name}: ${t.description}`).join('\n')}
            
            Provide your reasoning and a list of tool names.
        `,
    });
    
    // Create a new ToolSet with only the selected tools
    const selectedToolSet: ToolSet = {};
    for (const toolName of selectedTools.tools) {
        if (allTools[toolName]) {
            selectedToolSet[toolName] = allTools[toolName];
        }
    }
    
    return selectedToolSet;
}

export const selectToolsFromMultipleGroups = async (
    prompt: string, 
    groups: (string | undefined)[], 
    maxTools: number = 5
): Promise<ToolSet> => {
    // Filter out undefined values and provide defaults
    const safeGroups = groups.filter(g => g !== undefined) as string[];
    
    // Default to 'general' if no valid groups
    if (safeGroups.length === 0) {
        safeGroups.push('general');
    }
    
    // Get all tools from all specified groups
    const allToolsMap: ToolSet = {};
    const groupsToTools: Record<string, string[]> = {};
    
    // Collect tools from all groups
    for (const group of safeGroups) {
        const groupTools = await getToolsGroup(group);
        const groupToolNames = Object.keys(groupTools);
        groupsToTools[group] = groupToolNames;
        
        // Add tools to combined map
        for (const [key, tool] of Object.entries(groupTools)) {
            // If tool already exists from another group, keep it
            // (this handles duplicates across groups)
            if (!allToolsMap[key]) {
                allToolsMap[key] = tool as any;
            }
        }
    }
    
    // If we have fewer tools than maxTools, return all tools
    if (Object.keys(allToolsMap).length <= maxTools) {
        return allToolsMap;
    }
    
    // Get tool descriptions for AI to understand them
    const toolDescriptions = Object.entries(allToolsMap).map(([name, tool]) => {
        // Find which groups this tool belongs to
        const toolGroups = Object.entries(groupsToTools)
            .filter(([_, tools]) => tools.includes(name))
            .map(([group, _]) => group)
            .join(", ");
            
        return {
            name,
            description: tool.description || "No description available",
            groups: toolGroups
        };
    });
    
    // Use AI to select the most relevant tools
    const { object: selectedTools } = await generateObject({
        model: openai("gpt-4o"),
        schema: z.object({
            reasoning: z.string(),
            tools: z.array(z.string()).max(maxTools),
        }),
        prompt: `
            Based on the user request: "${prompt}"
            
            Select up to ${maxTools} of the most relevant tools to complete this request.
            Available tools (with their group categories):
            ${toolDescriptions.map(t => `- ${t.name} [${t.groups}]: ${t.description}`).join('\n')}
            
            Provide your reasoning and a list of tool names.
        `,
    });
    
    // Create a new ToolSet with only the selected tools
    const selectedToolSet: ToolSet = {};
    for (const toolName of selectedTools.tools) {
        if (allToolsMap[toolName]) {
            selectedToolSet[toolName] = allToolsMap[toolName];
        }
    }
    
    return selectedToolSet;
}
