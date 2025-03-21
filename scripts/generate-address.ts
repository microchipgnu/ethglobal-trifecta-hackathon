#!/usr/bin/env bun

/**
 * Generate an Ethereum address and private key using viem
 * This script uses viem's generatePrivateKey and privateKeyToAccount functions
 */

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

// Check if running with Bun
if (typeof Bun === 'undefined') {
  console.error("This script requires Bun to run.");
  process.exit(1);
}

console.log("Generating Ethereum private key and address...\n");

// Generate a new private key and account
const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

// Output the results
console.log(`PRIVATE_KEY\n${privateKey}\n\n`);
console.log(`ADDRESS\n${account.address}\n\n`);

console.log("");
console.log("Add these values to your .env file");
