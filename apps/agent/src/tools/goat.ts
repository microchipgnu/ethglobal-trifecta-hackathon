import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import walletClient from "../wallet";
import { viem } from "@goat-sdk/wallet-viem";
import { PEPE, USDC, erc20 } from "@goat-sdk/plugin-erc20";

export const getTools = async () => {

    const tools = await getOnChainTools({
        wallet: viem(walletClient as any),
        plugins: [
            erc20({
                tokens: [PEPE, USDC],
            }),
        ]
    })

    return tools;
}