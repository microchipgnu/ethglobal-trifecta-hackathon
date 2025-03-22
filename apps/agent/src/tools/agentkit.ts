import { AgentKit, ViemWalletProvider, } from "@coinbase/agentkit";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

export const getTools = async () => {
    const account = privateKeyToAccount(
        process.env.PRIVATE_KEY! as `0x${string}`
    );
    
    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });
    
    const walletProvider = new ViemWalletProvider(client);
    
    const agentKit = await AgentKit.from({
        walletProvider,
        actionProviders: [

        ]
    });

    // TODO: it says it's not async, but it is. KEEP IT
    const tools = await getVercelAITools(agentKit);

    return tools;
}