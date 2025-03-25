import crypto from 'node:crypto';
import { tool } from 'ai';
import { privateKeyToAccount } from 'viem/accounts';
import { z } from 'zod';

import { NEXT_TG_SECRET } from '@/lib/config';
import { getAgentService } from '@/lib/services';

// Function to derive a deterministic private key for the agent
export function botTokenToAccount(telegramBotToken: string): {
  address: `0x${string}`;
  privateKey: `0x${string}`;
} {
  if (!NEXT_TG_SECRET) {
    throw new Error('Missing SECRET');
  }

  // Use HKDF principles for secure key derivation
  const salt = crypto.createHash('sha256').update(telegramBotToken).digest();

  // Initial key material using the bot token
  const initialKey = crypto
    .createHmac('sha256', salt)
    .update(telegramBotToken)
    .digest();

  // Combine with server secret for additional security
  const info = Buffer.from('agent-wallet-derivation', 'utf8');
  const derivedKeyString = crypto
    .createHmac('sha256', NEXT_TG_SECRET)
    .update(Buffer.concat([initialKey, info]))
    .digest('hex');

  const privateKey: `0x${string}` = `0x${derivedKeyString}`;

  const account = privateKeyToAccount(privateKey);

  return {
    address: account.address,
    privateKey,
  };
}

export const experimental_createAgent = tool({
  type: 'function',
  parameters: z.object({
    name: z.string().describe('The name of the agent'),
    systemPrompt: z.string().describe('The system prompt for the agent'),
    telegramBotToken: z
      .string()
      .describe('The Telegram bot token for the agent'),
  }),
  description: 'Creates a new agent with the specified parameters.',
  execute: async ({ name, systemPrompt, telegramBotToken }) => {
    try {
      const agentService = await getAgentService();
      const agent = await agentService.createAgent({
        name,
        systemPrompt,
        telegramBotToken,
      });

      return {
        result: agent,
      };
    } catch (error) {
      console.error('Error creating agent:', error);
      return { error: 'Failed to create agent', details: error };
    }
  },
});
