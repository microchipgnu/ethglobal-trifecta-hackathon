import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

export const getAgentData = async () => {
    
    const publicClient = createPublicClient({
        chain: base,
        transport: http(),
    });

    const balance = await publicClient.getBalance({
        address: process.env.ADDRESS as `0x${string}`,
    });

    return { balance };
};