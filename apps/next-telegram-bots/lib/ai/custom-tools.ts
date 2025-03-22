import { type ToolSet, tool } from 'ai';
import { parseEther } from 'viem';
import { z } from 'zod';

import { getBaseUrl } from '@/lib/config';
import { getServices } from '@/lib/services';
import { encryptUserId } from '@/lib/telegram/utils';
import { generateRandomReward } from '@/lib/utils/rewards';
import { walletClient } from '@/lib/wallet';

type ParameterOverrides = Record<string, unknown>;

async function updateUserRewards(telegramId: number, amount: number) {
  const { userService } = await getServices();
  const user = await userService.findUserByTelegramId(telegramId);
  if (!user) return;

  await userService.updateUser(
    { telegramId },
    { totalRewards: (user.totalRewards || 0) + amount }
  );
}

export const getConnectLink = tool({
  description: 'Get a link for the user to connect their wallet',
  parameters: z.object({
    telegramId: z.number().describe('The Telegram ID of the user'),
  }),
  execute: async ({ telegramId }) => {
    try {
      const link = `${getBaseUrl()}/connect/${encryptUserId(telegramId)}`;
      return { link, success: true };
    } catch (error) {
      console.error('Error generating connect link:', error);
      return { error: 'Failed to generate link', success: false };
    }
  },
});

export const getUserBalance = tool({
  type: 'function',
  parameters: z.object({
    userEvmAddress: z
      .string()
      .describe('The evm address of the user to get balance for'),
  }),
  description: "Get the ETHbalance of a user's wallet",
  execute: async ({ userEvmAddress }) => {
    try {
      if (!userEvmAddress) {
        return { error: 'No wallet address found for this user' };
      }

      const response = await fetch(
        `https://api.basescan.org/api?module=account&action=balance&address=${userEvmAddress}&tag=latest&apikey=${process.env.BASESCAN_API}`
      );

      const data = await response.json();

      if (data.status !== '1') {
        throw new Error('Failed to fetch balance from Base Network');
      }

      // Convert from Wei to ETH(1 ETH= 10^18 Wei)
      const balanceInETH = Number(data.result) / 1e18;

      return { result: balanceInETH };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { error: 'Failed to get balance' };
    }
  },
});

export const sendETHReward = tool({
  description: 'Send ETH to a specified address with random reward amount',
  parameters: z.object({
    to: z
      .string()
      .startsWith('0x')
      .describe('The Ethereum address to send ETH to'),
  }),
  execute: async ({ to }) => {
    if (!walletClient.account) {
      throw new Error('No account connected to wallet client');
    }

    try {
      const { userService } = await getServices();
      const user = await userService.findUserByEvmAddress(to);

      if (!user) {
        return { error: 'User not found for this address' };
      }

      if (user.totalRewards >= 20) {
        return { error: 'User has reached temporary reward limit' };
      }

      const randomReward = generateRandomReward();

      if (randomReward === 0) {
        return { result: 'No reward this time' };
      }

      const amount = randomReward.toString();

      const hash = await walletClient.sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(amount),
        account: walletClient.account,
        chain: null,
      });

      // Update user's total rewards
      if (user) {
        await updateUserRewards(user.telegramId, Number.parseFloat(amount));
      }

      return { hash, amount };
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'Failed to send ETH' };
    }
  },
});

// Helper function to create tools with parameter overrides
export const createToolsWithOverrides = (
  tools: ToolSet,
  overrides: ParameterOverrides
): ToolSet => {
  const result: ToolSet = {};

  for (const [name, originalTool] of Object.entries(tools)) {
    if (!originalTool) continue;

    // Create a modified tool with updated schema and execution
    result[name] = tool({
      type: 'function',
      description: originalTool.description,
      // Update the schema to reflect that some parameters are pre-filled
      parameters:
        updateParameterSchema(originalTool.parameters, overrides) ||
        z.object({}),
      execute: async (args, options) => {
        // Merge the original args with the overrides
        const mergedArgs: Record<string, unknown> = { ...(args || {}) };

        // Apply overrides for matching parameter keys
        for (const key in overrides) {
          if (key in mergedArgs) {
            mergedArgs[key] = overrides[key];
          }
        }

        // Execute the original tool with the merged args
        if (originalTool.execute) {
          return originalTool.execute(mergedArgs, options);
        }
        return null;
      },
    });
  }

  return result;
};

// Helper function to update parameter schema to indicate pre-filled values
function updateParameterSchema(
  schema: z.ZodType<unknown> | undefined,
  overrides: ParameterOverrides
) {
  if (!schema || !(schema instanceof z.ZodObject)) {
    return schema;
  }

  // Create a new schema with updated descriptions
  const shape = schema.shape;
  const newShape: Record<string, z.ZodTypeAny> = {};

  for (const [key, zodType] of Object.entries(shape)) {
    if (key in overrides) {
      // Update the description to indicate this parameter is pre-filled
      if (zodType instanceof z.ZodString) {
        newShape[key] = zodType.describe(
          `${
            zodType.description || ''
          } (Pre-filled with value from context: ${String(overrides[key])})`
        );
      } else {
        // For other types, we still update the description
        const originalDescription =
          (zodType as z.ZodTypeAny)._def?.description || '';
        const newZodType = zodType as z.ZodTypeAny;
        if (newZodType.describe) {
          newShape[key] = newZodType.describe(
            `${originalDescription} (Pre-filled with value from context: ${String(
              overrides[key]
            )})`
          );
        } else {
          newShape[key] = zodType as z.ZodTypeAny;
        }
      }
    } else {
      newShape[key] = zodType as z.ZodTypeAny;
    }
  }

  return z.object(newShape);
}

export const customTools: ToolSet = {
  getConnectLink,
  getUserBalance,
  sendETHReward,
};

export const getCustomTools = (userId: number): ToolSet => {
  const overrides: ParameterOverrides = {
    userId,
  };

  return createToolsWithOverrides(customTools, overrides);
};
