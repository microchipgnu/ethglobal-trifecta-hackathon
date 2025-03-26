import { http, createWalletClient, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { getRpcUrl } from './constants';
// Create an account from the private key
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

export const mainnetWalletClient = createWalletClient({
  account,
  chain: base,
  transport: http(getRpcUrl(base.id)),
});

export const testnetWalletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(getRpcUrl(baseSepolia.id)),
});

export const mainnetPublicClient = createPublicClient({
  chain: base,
  transport: http(getRpcUrl(base.id)),
});

export const testnetPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(getRpcUrl(baseSepolia.id)),
});
