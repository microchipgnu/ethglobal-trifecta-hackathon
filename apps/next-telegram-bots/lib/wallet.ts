import { http, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { getRpcUrl } from './constants';
// Create an account from the private key
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

// Create a wallet client
export const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(getRpcUrl(baseSepolia.id)),
});
