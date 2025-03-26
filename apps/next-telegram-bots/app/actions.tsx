'use server';

import { AGENT_WALLET_ADDRESS } from '@/lib/constants';
import { getUserService } from '@/lib/services';
import { decryptUserId } from '@/lib/telegram/utils';
import { z } from 'zod';
import {
  createPublicClient,
  erc20Abi,
  formatEther,
  http,
  parseEther,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { getRpcUrl } from '@/lib/constants';
import { testnetWalletClient } from '@/lib/clients';

// Create a public client for Base mainnet
const publicClient = createPublicClient({
  chain: base,
  transport: http(getRpcUrl(base.id)),
});

// Schema for user data validation with more robust parsing
const userDataSchema = z.object({
  telegramId: z.coerce.number().int().positive(),
  evmAddress: z.string().trim().min(1),
});

export async function checkSiweStatus(connectedWallet?: string) {
  try {
    if (!connectedWallet) {
      console.log('Connected wallet is not provided or undefined');
      return false;
    }

    const userService = await getUserService();

    // Find user by the connected wallet address
    const existingUser =
      await userService.findUserByEvmAddress(connectedWallet);

    if (!existingUser) {
      console.log('User not found or address not linked');
      return false;
    }

    // Check if the connected wallet matches the user's evmAddress
    if (existingUser.evmAddress === connectedWallet) {
      console.log("Wallet address matches the user's record");
      return true;
    }
    console.log("Wallet address does not match the user's record");
    return false;
  } catch (error) {
    console.error('Error checking SIWE status:', error);
    return false;
  }
}

export async function checkDepositStatus(connectedWallet?: string) {
  try {
    if (!connectedWallet) {
      console.log('Connected wallet is not provided or undefined');
      return false;
    }

    const userService = await getUserService();

    // Find user by the connected wallet address
    const existingUser =
      await userService.findUserByEvmAddress(connectedWallet);

    if (!existingUser) {
      console.log('User not found or address not linked');
      return false;
    }

    // Check if the deposit is a non-empty string starting with "0x"
    if (
      typeof existingUser.depositHash === 'string' &&
      existingUser.depositHash.startsWith('0x') &&
      existingUser.depositHash.trim() !== ''
    ) {
      console.log("Deposit is valid and starts with '0x'");
      return true;
    }
    console.log('Deposit is invalid or does not exist');
    return false;
  } catch (error) {
    console.error('Error checking deposit status:', error);
    return false;
  }
}

export async function updateUserAction(formData: FormData) {
  try {
    // Extract and validate form data in one step
    const formInviteCode = formData.get('inviteCode');

    if (!formInviteCode || typeof formInviteCode !== 'string') {
      return { success: false, message: 'Invalid invite code' };
    }

    const inviteCode = decryptUserId(formInviteCode);
    console.log('inviteCode', inviteCode);

    const userData = userDataSchema.parse({
      telegramId: Number.parseInt(inviteCode),
      evmAddress: formData.get('evmAddress'),
    });

    const userService = await getUserService();

    // Find user and check conditions in one database query if possible
    const existingUser = await userService.findUserByTelegramId(
      userData.telegramId
    );

    if (!existingUser) {
      return { success: false, message: 'User not found' };
    }

    console.log('existingUser', existingUser);

    if (existingUser.evmAddress) {
      return { success: true, message: 'Account linked' };
    }

    // Update user with simplified query
    await userService.updateUser(
      { telegramId: userData.telegramId },
      { evmAddress: userData.evmAddress }
    );

    return { success: true, message: 'Address linked successfully' };
  } catch (error) {
    console.error('Failed to update user:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to link address, please try again later',
    };
  }
}

export async function checkRegisteredUser(
  evmAddress: string
): Promise<boolean> {
  try {
    const userService = await getUserService();
    const user = await userService.findUserByEvmAddress(evmAddress);

    return !!user;
  } catch (error) {
    console.error('Error checking if user is registered:', error);
    return false;
  }
}

export async function updateUserDeposit(
  evmAddress: string,
  transactionHash?: string
): Promise<{
  success: boolean;
  depositHash?: string;
  tokenTxHash?: string;
  message?: string;
}> {
  try {
    console.log('Fetching user from database...');
    const userService = await getUserService();
    const user = await userService.findUserByEvmAddress(evmAddress);

    if (!user) {
      console.log('User not found in database');
      return { success: false, message: 'User not found' };
    }

    // If transaction hash is provided, verify it directly
    if (transactionHash && !user.depositHash) {
      console.log('Verifying provided transaction hash:', transactionHash);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });

      if (!receipt || receipt.status !== 'success') {
        return { success: false, message: 'Failed to verify transaction' };
      }

      const tx = await publicClient.getTransaction({
        hash: transactionHash as `0x${string}`,
      });

      // Minimum deposit amount in ETH
      const minDepositAmount = parseEther('0.001');
      const depositAmount = tx.value;

      if (
        tx.from.toLowerCase() === evmAddress.toLowerCase() &&
        tx.to?.toLowerCase() === AGENT_WALLET_ADDRESS.toLowerCase() &&
        depositAmount >= minDepositAmount &&
        receipt.status === 'success'
      ) {
        console.log('Transaction verified, updating user deposit...');
        await userService.updateUser(
          { evmAddress },
          {
            depositHash: transactionHash,
            depositAmount: Number.parseFloat(formatEther(depositAmount)),
          }
        );

        // send 10k $MCRV to the user on baseSepolia
        const mcrvTxHash = await testnetWalletClient.writeContract({
          address: process.env.TOKEN_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [evmAddress as `0x${string}`, parseEther('10000')],
        });

        console.log('mcrvTxHash', mcrvTxHash);
        return {
          success: true,
          depositHash: transactionHash,
          tokenTxHash: mcrvTxHash,
        };
      }
    }

    return { success: true, depositHash: user.depositHash };
  } catch (error) {
    console.error('Failed to update user deposit:', error);
    return { success: false, message: 'Failed to update user deposit' };
  }
}
