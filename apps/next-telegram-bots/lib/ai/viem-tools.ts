import { tool } from 'ai';
import {
  type PublicClient,
  type WalletClient,
  formatEther,
  parseEther,
} from 'viem';
import { z } from 'zod';

// New function to create public client tools
export function createPublicClientTools(publicClient: PublicClient) {
  return {
    getBalance: tool({
      description: 'Get the ETH balance of a specified address',
      parameters: z.object({
        address: z
          .string()
          .startsWith('0x')
          .describe('The Ethereum address to check balance for'),
      }),
      execute: async ({ address }) => {
        try {
          const balance = await publicClient.getBalance({
            address: address as `0x${string}`,
          });
          return { balance: formatEther(balance) };
        } catch (error: unknown) {
          console.error(error);
          if (error instanceof Error) {
            return { error: error.message };
          }
          return { error: 'Failed to get balance: Unknown error' };
        }
      },
    }),
  };
}

// Create a tools factory that takes a wallet client
export function createWalletClientTools(walletClient: WalletClient) {
  return {
    sendEth: tool({
      description: 'Send ETH to a specified address',
      parameters: z.object({
        to: z
          .string()
          .startsWith('0x')
          .describe('The Ethereum address to send ETH to'),
        amount: z.string().describe('The ETH amount to send i.e 0.01'),
      }),
      execute: async ({ to, amount }) => {
        if (!walletClient.account) {
          throw new Error('No account connected to wallet client');
        }

        try {
          const hash = await walletClient.sendTransaction({
            to: to as `0x${string}`,
            value: parseEther(amount),
            account: walletClient.account,
            chain: null,
          });

          return { hash };
        } catch (error) {
          console.error(error);
          if (error instanceof Error) {
            return { error: error.message };
          }
          return { error: 'Failed to send ETH: Unknown error' };
        }
      },
    }),
  };
}

// Define types for our tool sets
type PublicClientToolSet = ReturnType<typeof createPublicClientTools>;
type WalletClientToolSet = ReturnType<typeof createWalletClientTools>;
type CombinedToolSet = PublicClientToolSet & WalletClientToolSet;

// Combined function to create all tools based on provided clients
export function getViemToolSet({
  publicClient,
  walletClient,
}: {
  publicClient?: PublicClient;
  walletClient?: WalletClient;
}) {
  let toolsSet = {} as CombinedToolSet;

  if (publicClient) {
    toolsSet = { ...toolsSet, ...createPublicClientTools(publicClient) };
  }

  if (walletClient) {
    toolsSet = { ...toolsSet, ...createWalletClientTools(walletClient) };
  }

  return toolsSet;
}
