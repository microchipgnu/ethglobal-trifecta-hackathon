import { AgentKit, compoundActionProvider, defillamaActionProvider, erc20ActionProvider, erc721ActionProvider, jupiterActionProvider, openseaActionProvider, pythActionProvider, ViemWalletProvider, walletActionProvider, wethActionProvider, wowActionProvider, } from "@coinbase/agentkit";
import { getVercelAITools } from "@coinbase/agentkit-vercel-ai-sdk";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

export const getTools = async () => {
    const account = privateKeyToAccount(
        process.env.PRIVATE_KEY! as `0x${string}`
    );
    
    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    });
    
    const walletProvider = new ViemWalletProvider(client);
    
    const agentKit = await AgentKit.from({
        walletProvider,
        actionProviders: [
         walletActionProvider(),
         wowActionProvider(),
         wethActionProvider(),
         pythActionProvider(),
        //  openseaActionProvider(), // Requires API key
         compoundActionProvider(),
         jupiterActionProvider(),
         defillamaActionProvider(),
         erc20ActionProvider(),
         erc721ActionProvider(),
        ]
    });
    // TODO: it says it's not async, but it is. KEEP IT
    const tools = await getVercelAITools(agentKit);

    console.log(tools);

    return tools;
}