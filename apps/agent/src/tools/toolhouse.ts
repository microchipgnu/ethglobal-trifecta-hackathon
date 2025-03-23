import { Toolhouse } from "@toolhouseai/sdk";
import type { ToolSet } from "ai";

const toolhouse = new Toolhouse({
    apiKey: process.env.TOOLHOUSE_API_KEY,
    provider: "vercel"
});

export const getTools = async () => {
    const tools = await toolhouse.getTools("midcurve");
    return tools as ToolSet;
}