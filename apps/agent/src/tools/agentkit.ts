import {
  AgentKit,
  ViemWalletProvider,
  erc20ActionProvider,
  erc721ActionProvider,
  walletActionProvider,
  wethActionProvider,
} from '@coinbase/agentkit';
import { getVercelAITools } from '@coinbase/agentkit-vercel-ai-sdk';
import { mainnetWalletClient } from '../wallet';

export const getTools = async () => {
  const walletProvider = new ViemWalletProvider(mainnetWalletClient);

  const agentKit = await AgentKit.from({
    walletProvider,
    actionProviders: [
      walletActionProvider(),
      // wowActionProvider(),
      wethActionProvider(),
      // pythActionProvider(),
      //  openseaActionProvider(), // Requires API key
      // compoundActionProvider(),
      // jupiterActionProvider(),
      // defillamaActionProvider(),
      erc20ActionProvider(),
      erc721ActionProvider(),
    ],
  });
  // TODO: it says it's not async, but it is. KEEP IT
  const tools = await getVercelAITools(agentKit);

  return tools;
};
