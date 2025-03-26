import type { GoatToolDefinitions } from '@/lib/ai/goat-tools-types';
import { mainnetWalletClient } from '@/lib/clients';
import { getOnChainTools } from '@goat-sdk/adapter-vercel-ai';
import { viem } from '@goat-sdk/wallet-viem';

// 1. Create a wallet client

export const getGoatTools = async () => {
  const tools = (await getOnChainTools({
    // biome-ignore lint/suspicious/noExplicitAny: <types are not goated>
    wallet: viem(mainnetWalletClient as any),
  })) as GoatToolDefinitions;

  // modify each goat tool to have additional description
  const updatedTools = Object.fromEntries(
    Object.entries(tools).map(([key, tool]) => [
      key,
      {
        ...tool,
        description: `${tool.description} \n\n Use for the agent's wallet, not the user's wallet.`,
      },
    ])
  );
  return updatedTools;
};
