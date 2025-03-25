'use server';

import { AGENT_WALLET_ADDRESS } from '@/lib/constants';
import { getUserService } from '@/lib/services';
import { decryptUserId } from '@/lib/telegram/utils';
import { z } from 'zod';

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
      return { success: true, message: 'Address already linked' };
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
  evmAddress: string
): Promise<{ success: boolean; depositHash?: string; message?: string }> {
  try {
    console.log('Fetching user from database...');
    const userService = await getUserService();
    const user = await userService.findUserByEvmAddress(evmAddress);

    if (!user) {
      console.log('User not found in database');
      return { success: false, message: 'User not found' };
    }

    console.log('Fetching transactions from Base API...');
    const response = await fetch(
      `https://api.basescan.org/api?module=account&action=txlist&address=${evmAddress}&startblock=0&endblock=latest&page=1&offset=2&sort=desc&apikey=${process.env.BASESCAN_API}`
    );
    const data = await response.json();

    if (data.status !== '1') {
      console.log('Failed to fetch transactions from Base API');
      return {
        success: false,
        message:
          'Failed to fetch transactions from Base Network, check again later or contact support',
      };
    }

    console.log('Searching for matching transaction...');
    const transactions = data.result;
    const matchingTx = transactions.find(
      (tx: {
        from: string;
        to: string;
        value: string;
        txreceipt_status: string;
        hash: string;
      }) =>
        tx.from.toLowerCase() === evmAddress.toLowerCase() &&
        tx.to.toLowerCase() === AGENT_WALLET_ADDRESS.toLowerCase() &&
        Number.parseFloat(tx.value) >= 5 &&
        tx.txreceipt_status === '1'
    );

    if (!matchingTx) {
      console.log('No matching transaction found');
      return {
        success: false,
        message: 'No deposit transaction has been found',
      };
    }

    console.log('Updating user deposit in database...');
    await userService.updateUser(
      { evmAddress },
      { depositHash: matchingTx.hash.toString() }
    );

    return { success: true, depositHash: matchingTx.hash.toString() };
  } catch (error) {
    console.error('Failed to update user deposit:', error);
    return { success: false, message: 'Failed to update user deposit' };
  }
}
