import { getOnChainTools } from '@goat-sdk/adapter-vercel-ai';
import { PEPE, USDC, erc20 } from '@goat-sdk/plugin-erc20';
import { viem } from '@goat-sdk/wallet-viem';
import { mainnetWalletClient } from '../wallet';

export const getTools = async () => {
  const tools = await getOnChainTools({
    wallet: viem(mainnetWalletClient as any),
    plugins: [
      erc20({
        tokens: [PEPE, USDC],
      }),
    ],
  });

  return tools;
};
