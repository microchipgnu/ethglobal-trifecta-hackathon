import redisClient from "../db/redis";

const setLastUsedTool = async (tool: string) => {
    await redisClient.append("agent_last_used_tools", tool);
}

export { setLastUsedTool };