import { type ToolSet, tool } from 'ai';
import {
  http,
  type Address,
  createPublicClient,
  erc20Abi,
  formatEther,
  parseEther,
} from 'viem';
import { z } from 'zod';

import { createToolsWithOverrides } from '@/lib/ai/tools/utils';
import { getBaseUrl } from '@/lib/config';
import { getRpcUrl } from '@/lib/constants';
import { getTaskService, getUserService } from '@/lib/services';
import { TaskStatus } from '@/lib/services/tasks.service';
import { encryptUserId } from '@/lib/telegram/utils';
import { generateRandomReward } from '@/lib/utils/rewards';
import { walletClient } from '@/lib/wallet';
import { baseSepolia } from 'viem/chains';

const MAXIMUM_COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const COOLDOWN_MULTIPLIER_MS = 4320000; // 1.2 hours per ETH reward
const REQUIRED_MCRV_BALANCE = 10000; // 10k MCRV tokens required to create a task

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(getRpcUrl(baseSepolia.id)),
});

const testnetPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(getRpcUrl(baseSepolia.id)),
});

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

export const getMCRVBalance = tool({
  type: 'function',
  parameters: z.object({
    userEvmAddress: z
      .string()
      .describe('The address to get MCRV token balance for'),
  }),
  description: 'Get the MCRV token balance for an evm address',
  execute: async ({ userEvmAddress }) => {
    try {
      const balance = await testnetPublicClient.readContract({
        abi: erc20Abi,
        address: process.env.TOKEN_ADDRESS as `0x${string}`,
        functionName: 'balanceOf',
        args: [userEvmAddress as `0x${string}`],
      });

      console.log(`User ${userEvmAddress} has ${balance} MCRV tokens`);

      return { result: formatEther(balance) };
    } catch (error) {
      console.error('Error getting MCRV balance:', error);
      return { error: 'Failed to get MCRV balance' };
    }
  },
});

export const createTask = tool({
  type: 'function',
  parameters: z.object({
    userId: z.number().describe('Telegram id of the user creating the task'),
    prompt: z.string().describe('The prompt for the task to create'),
  }),
  description:
    'Creates a task if user has at least 10k MCRV tokens and no pending tasks',
  execute: async ({ userId, prompt }) => {
    try {
      // Get user details
      const userService = await getUserService();
      const user = await userService.findUserByTelegramId(userId);

      if (!user) {
        return { error: 'User not found' };
      }

      if (!user.evmAddress) {
        return {
          error:
            'User has no connected wallet. Please connect your wallet first.',
        };
      }

      // Check MCRV balance
      try {
        const balance = await testnetPublicClient.readContract({
          abi: erc20Abi,
          address: process.env.TOKEN_ADDRESS as `0x${string}`,
          functionName: 'balanceOf',
          args: [user.evmAddress as `0x${string}`],
        });

        const formattedBalance = Number.parseFloat(formatEther(balance));

        if (formattedBalance < REQUIRED_MCRV_BALANCE) {
          return {
            error: `Insufficient MCRV tokens. You have ${formattedBalance} MCRV but need at least ${REQUIRED_MCRV_BALANCE} MCRV to create a task.`,
          };
        }

        // Check for pending tasks
        const taskService = await getTaskService();
        const userTasks =
          await taskService.findTasksByCreatorTelegramId(userId);

        const pendingTasks = userTasks.filter(
          (task) =>
            task.status === TaskStatus.PENDING ||
            task.status === TaskStatus.IN_PROGRESS
        );

        if (pendingTasks.length > 0) {
          return {
            error:
              'You already have a pending task. Please wait for it to complete before creating a new one.',
          };
        }

        // Create the task
        const newTask = await taskService.createTask({
          creatorTelegramId: userId,
          creatorTelegramUsername: user.username,
          creatorEVMAddress: user.evmAddress,
          prompt: prompt,
        });

        return {
          result: `Task ${newTask.id} created and submitted to the agent.`,
        };
      } catch (error) {
        console.error('Error checking MCRV balance:', error);
        return { error: 'Failed to check MCRV balance' };
      }
    } catch (error) {
      console.error('Error creating task:', error);
      return { error: 'Failed to create task' };
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

export const getInProgressTask = tool({
  description: 'Get the in progress task that the agent is working on',
  parameters: z.object({}),
  execute: async () => {
    const taskService = await getTaskService();
    const task = await taskService.findTask({
      status: TaskStatus.IN_PROGRESS,
    });
    if (!task) {
      return { result: 'No in progress task found' };
    }

    return {
      result: {
        id: task.id,
        username: task.creatorTelegramUsername,
        prompt: task.prompt,
        startedAt: task.startedAt,
      },
    };
  },
});

export const getPendingTasks = tool({
  description: 'Get the next 5 pending tasks',
  parameters: z.object({}),
  execute: async () => {
    const taskService = await getTaskService();
    const tasks = await taskService.findTasks({
      filter: { status: TaskStatus.PENDING },
      limit: 5,
      order: 'asc',
    });
    const simplifiedTasks = tasks.map((task) => ({
      id: task.id,
      username: task.creatorTelegramUsername,
      prompt: task.prompt,
    }));
    return { result: simplifiedTasks };
  },
});

export const getCompletedTasks = tool({
  description: 'Get the next 5 completed tasks',
  parameters: z.object({}),
  execute: async () => {
    const taskService = await getTaskService();
    const tasks = await taskService.findTasks({
      filter: { status: TaskStatus.COMPLETED },
      limit: 5,
      order: 'desc',
    });
    const simplifiedTasks = tasks.map((task) => ({
      id: task.id,
      username: task.creatorTelegramUsername,
      prompt: task.prompt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
    }));
    return { result: simplifiedTasks };
  },
});

export const getCustomTools = (userId?: number): ToolSet => {
  const tools = {
    getConnectLink,
    getETHBalance,
    getMCRVBalance,
    sendETHReward,
    createTask,
    getInProgressTask,
    getPendingTasks,
    getCompletedTasks,
  };

  return userId ? createToolsWithOverrides(tools, { userId }) : tools;
};
