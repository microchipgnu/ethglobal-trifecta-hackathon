import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

export const getAgentData = async () => {

    const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

    const publicClient = createPublicClient({
        chain: base,
        transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
    });

    const balance = await publicClient.getBalance({
        address: import.meta.env.VITE_ADDRESS as `0x${string}`,
    });

    return { balance };
};