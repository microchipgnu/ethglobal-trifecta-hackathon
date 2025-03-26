import { createConfig } from '@privy-io/wagmi';
import { http } from 'viem';
import { base } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});
