import redisClient from "../db/redis";

const setAgentState = async (state: any) => {
    await redisClient.set("agent_status", JSON.stringify(state));
}

const getAgentState = async () => {
    const state = await redisClient.get("agent_status");
    return JSON.parse(state);
}

export { setAgentState, getAgentState };