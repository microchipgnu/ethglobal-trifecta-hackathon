import { type ToolSet, tool } from 'ai';
import {
  createPublicClient,
  formatEther,
  http,
  parseEther,
  type Address,
} from 'viem';
import { z } from 'zod';

import { getBaseUrl } from '@/lib/config';
import { getUserService } from '@/lib/services';
import { encryptUserId } from '@/lib/telegram/utils';
import { walletClient } from '@/lib/wallet';
import { generateRandomReward } from '@/lib/utils/rewards';
import { baseSepolia } from 'viem/chains';
import { createToolsWithOverrides } from '@/lib/ai/tools/utils';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.RPC_PROVIDER_URL),
});
const MAXIMUM_COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const COOLDOWN_MULTIPLIER_MS = 4320000; // 1.2 hours per ETH reward

const calculateRewardCooldownDate = (rewardAmount: number) => {
  if (rewardAmount < 1) {
    return null;
  }
  const now = Date.now();

  if (rewardAmount > 20) {
    return new Date(now + MAXIMUM_COOLDOWN_MS);
  }

  const cooldownMs = rewardAmount * COOLDOWN_MULTIPLIER_MS;

  return new Date(now + cooldownMs);
};

async function updateUserRewards(telegramId: number, rewardAmount: number) {
  const userService = await getUserService();
  const user = await userService.findUserByTelegramId(telegramId);
  if (!user) return;

  await userService.updateUser(
    { telegramId },
    {
      totalRewards: user.totalRewards + rewardAmount,
      rewardCooldownDate: calculateRewardCooldownDate(rewardAmount),
    }
  );
}

// Create the tool using the createTool function from Vercel AI SDK
export const getConnectLink = tool({
  type: 'function',
  parameters: z.object({
    userId: z.number().describe('Telegram id of the user'),
  }),
  description: 'Generates a URL for linking a wallet to a telegram user',
  execute: async ({ userId }) => {
    try {
      // Encrypt the user ID to a short string
      const encryptedId = encryptUserId(userId);

      // Generate the connect URL using the base URL and the encrypted user ID
      const connectUrl = `${getBaseUrl()}/connect/${encryptedId}`;
      console.log('Encrypted user ID:', encryptedId);

      // Return the connect URL
      return { result: connectUrl };
    } catch (error) {
      console.error('Error generating connect link:', error);
      return { error: 'Failed to generate connect link' };
    }
  },
});

export const getETHBalance = tool({
  type: 'function',
  parameters: z.object({
    userEvmAddress: z
      .string()
      .describe('The evm address of the user to get balance for'),
  }),
  description: 'Get the ETH balance for an evm address',
  execute: async ({ userEvmAddress }) => {
    try {
      const balance = await publicClient.getBalance({
        address: userEvmAddress as `0x${string}`,
      });

      return { result: formatEther(balance) };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { error: 'Failed to get balance' };
    }
  },
});

export const sendETHReward = tool({
  description: 'Trigger a reward chance for a user.  Jackpot amount is 100 ETH',
  parameters: z.object({
    recipient: z.string().describe('The address to send ETH to'),
  }),
  execute: async ({ recipient }) => {
    try {
      const userService = await getUserService();
      const user = await userService.findUserByEvmAddress(recipient);
      if (!user) {
        return { error: 'No registered user found for this address' };
      }
      if (user.rewardCooldownDate && user?.rewardCooldownDate > new Date()) {
        return {
          error: `User reward cooldown until ${user.rewardCooldownDate}`,
        };
      }

      const rewardAmount = generateRandomReward();

      if (rewardAmount === 0) {
        return { result: 'No reward' };
      }

      const rewardAmountString = rewardAmount.toString();

      const hash = await walletClient.sendTransaction({
        to: recipient as Address,
        value: parseEther(rewardAmountString),
        account: walletClient.account,
      });

      const { status } = await publicClient.waitForTransactionReceipt({ hash });

      // Update user's total rewards
      if (status === 'reverted') {
        return { error: 'Failed to send reward' };
      }

      await updateUserRewards(user.telegramId, rewardAmount);

      return { hash, amount: rewardAmount };
    } catch (error) {
      console.error(error);
      return { error: 'Failed to send reward' };
    }
  },
});

export const getCustomTools = (userId?: number): ToolSet => {
  const tools = {
    getConnectLink,
    getETHBalance,
    sendETHReward,
  };

  return userId ? createToolsWithOverrides(tools, { userId }) : tools;
};
