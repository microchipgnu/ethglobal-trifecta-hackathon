import type { GoatToolDefinitions } from '@/lib/ai/goat-tools-types';
import { getRpcUrl } from '@/lib/constants';
import { getOnChainTools } from '@goat-sdk/adapter-vercel-ai';
import { viem } from '@goat-sdk/wallet-viem';
import { http, createWalletClient, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// 1. Create a wallet client
const account = privateKeyToAccount(
  process.env.NEXT_TG_PRIVATE_KEY as `0x${string}`
);

const walletClient = createWalletClient({
  account: account,
  transport: http(getRpcUrl(baseSepolia.id)),
  chain: baseSepolia,
});

export const getGoatTools = async () => {
  const tools = (await getOnChainTools({
    // biome-ignore lint/suspicious/noExplicitAny: <types are not goated>
    wallet: viem(walletClient as any),
  })) as GoatToolDefinitions;

  // modify each goat tool to have additional description
  const updatedTools = Object.fromEntries(
    Object.entries(tools).map(([key, tool]) => [
      key,
      {
        ...tool,
        description: `This GOAT tool is for the agent's wallet, not the user's wallet. ${tool.description}`,
      },
    ])
  );
  return updatedTools;
};
