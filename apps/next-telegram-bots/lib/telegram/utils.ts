import { createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import { ObjectId } from 'mongodb';

export function toObjectId(id: string | number): ObjectId {
  if (ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  const hash = createHash('md5').update(id.toString()).digest('hex');
  const objectIdHex = hash.substring(0, 24);
  return new ObjectId(objectIdHex);
}

export const getFilterFromSearchParams = (searchParams: URLSearchParams) => {
  const filter: Record<string, string | number | ObjectId> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!Number.isNaN(Number(value))) {
      filter[key] = Number.parseInt(value);
    } else {
      filter[key] = value;
    }
  }

  // if filter is empty, return null
  if (Object.keys(filter).length === 0) {
    return null;
  }

  return filter;
};

// Encryption/decryption utilities
import { NEXT_TG_SECRET } from '@/lib/config';

/**
 * Encrypts a user ID to a URL-friendly string
 * @param userId Telegram user ID to encrypt
 * @returns Encrypted string
 */
export function encryptUserId(userId: string | number): string {
  if (!NEXT_TG_SECRET) {
    throw new Error('NEXT_TG_SECRET environment variable is not set');
  }

  // Convert userId to string if it's a number
  const userIdStr = userId.toString();

  // Create a hash of the secret to get consistent key and iv
  const hash = createHash('sha256').update(NEXT_TG_SECRET).digest();
  const key = hash.subarray(0, 32); // Use first 32 bytes for key
  const iv = hash.subarray(0, 16); // Use first 16 bytes for IV

  // Create cipher
  const cipher = createCipheriv('aes-256-cbc', key, iv);

  // Encrypt the user ID
  let encrypted = cipher.update(userIdStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Make it URL-safe
  return encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decrypts a URL-friendly encrypted string back to a user ID
 * @param encryptedId Encrypted user ID string
 * @returns Original user ID
 */
export function decryptUserId(encryptedId: string): string {
  if (!NEXT_TG_SECRET) {
    throw new Error('NEXT_TG_SECRET environment variable is not set');
  }

  try {
    // Restore padding for base64
    let paddedId = encryptedId;
    const remainder = paddedId.length % 4;
    if (remainder > 0) {
      paddedId += '='.repeat(4 - remainder);
    }

    // Make it base64 compatible again
    paddedId = paddedId.replace(/-/g, '+').replace(/_/g, '/');

    // Create a hash of the secret to get consistent key and iv
    const hash = createHash('sha256').update(NEXT_TG_SECRET).digest();
    const key = hash.subarray(0, 32); // Use first 32 bytes for key
    const iv = hash.subarray(0, 16); // Use first 16 bytes for IV

    // Create decipher
    const decipher = createDecipheriv('aes-256-cbc', key, iv);

    // Decrypt
    let decrypted = decipher.update(paddedId, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Invalid encrypted ID');
  }
}

import type { Attachment, Message } from 'ai';
import type { Filter } from 'grammy';

import type { MyContext } from '@/lib/telegram/types';

/**
 * Convert a Telegram message context to an AI message
 */
export const messageCtxToAiMessage = (
  ctx: Filter<MyContext, 'message'>,
  attachments?: Attachment[]
): Message => {
  const chatId = ctx.chatId;
  const updateId = ctx.update.update_id;
  const messageDateObj = new Date(ctx.msg.date * 1000);
  const text = ctx.msg.text || '';
  const caption = ctx.msg.caption || '';
  const entityTypesString = ctx.msg.entities
    ? JSON.stringify(ctx.msg.entities.map((entity) => entity.type))
    : '';

  const contentString = `${text}\n${caption}\nAttachment types: ${entityTypesString}`;
  console.log('contentString', contentString);
  console.log('attachments', attachments);

  return {
    id: `${chatId}-${updateId}`,
    role: 'user',
    content: contentString,
    experimental_attachments: attachments,
    createdAt: messageDateObj,
  };
};
