import { readFileSync, unlinkSync } from 'node:fs';
import { extname } from 'node:path';
import { parseJSON } from '@ai-sdk/provider-utils';
import { hydrateFiles } from '@grammyjs/files';
import { limit } from '@grammyjs/ratelimiter';
import { type ISession, MongoDBAdapter } from '@grammyjs/storage-mongodb';
import { put } from '@vercel/blob';
import type { Attachment } from 'ai';
import { Bot, lazySession } from 'grammy';
import type { File as TelegramFile, UserFromGetMe } from 'grammy/types';
import Redis from 'ioredis';
import { z } from 'zod';

import { handleGenerateText } from '@/lib/ai/handle-generate-text';
import {
  DATABASE_NAME,
  MAX_BLOB_FILE_SIZE,
  SESSIONS_COLLECTION,
} from '@/lib/constants';
import client from '@/lib/mongodb';
import {
  getAllServices,
  getMessageService,
  initializeServices,
} from '@/lib/services';
import type {
  MyApi,
  MyBot,
  MyContext,
  SessionData,
} from '@/lib/telegram/types';

import { REDIS_URL } from '@/lib/config';
import type { MessageDTO } from '@/lib/services/message.service';
import { registerCommandHandlers } from '@/lib/telegram/commands';
import { messageCtxToAiMessage } from '@/lib/telegram/utils';
// Array of playful error messages
const REPLY_ERROR_MESSAGES = [
  "I'm busy checking my bags, please try again in a moment. 💼",
  'Analyzing $ETH chart right now, try again later 📈',
  'I am doing some degen research, please try again shortly 🔍',
  "Sorry, I'm in the middle of a yield farming session. Try again in a moment. 🌾",
  'Hunting for alpha on Midcurve.live, please stand by and try again soon 🕵️',
];

// Array of sassy rate limit messages
const RATE_LIMIT_MESSAGES = [
  "You're more repetitive than a failed ETH transaction, @{username} 🔄",
  'Stop spamming meeegh @{username}! Even $MCRV has more utility than your requests 🐸',
  "Congrats @{username}, you've discovered how to NOT get rewards. Revolutionary 👏",
  "You're boring @{username}. Try something more creative than spam 🥱",
  "Hey @{username}, this isn't an ETH airdrop. Chill with the requests 🧊",
  "Breaking news: @{username} discovers spamming doesn't increase APY 📰",
  "Dear @{username}, I'm a Midcurve bot, not your personal slot machine 🎰",
  "@{username} used SPAM. It's not very effective... 🎮",
  "I've seen better strategies from people buying ETH at ATH, @{username} 📉",
  'Are you trying to DOS me, @{username}? My bags are heavier than your attacks 💰',
];

if (!REDIS_URL) {
  throw new Error('REDIS_URL is not set');
}

const redis = new Redis(REDIS_URL);

const getTooManyRequestsReplyMessage = (username: string) => {
  const randomMessage =
    RATE_LIMIT_MESSAGES[Math.floor(Math.random() * RATE_LIMIT_MESSAGES.length)];
  return randomMessage.replace('{username}', username);
};

export const getBot = async (
  botToken: string,
  botInfo?: UserFromGetMe
): Promise<MyBot> => {
  if (!botToken) {
    throw new Error('Telegram bot token required');
  }

  // Ensure DB and services are initialized
  await initializeServices();
  const db = client.db(DATABASE_NAME);

  // Get services
  const { agentService, chatService, userService } = await getAllServices();

  const bot: MyBot = new Bot<MyContext, MyApi>(botToken, {
    botInfo,
  });

  if (!botInfo) {
    await bot.init();
  }

  const botId = bot.botInfo.id;

  bot.api.config.use(hydrateFiles(bot.token));

  const sessions = db.collection<ISession>(SESSIONS_COLLECTION);

  bot.use(
    lazySession({
      initial: (): SessionData => ({
        user: undefined,
        chat: undefined,
        agent: undefined,
        messages: [],
      }),
      storage: new MongoDBAdapter<SessionData>({
        collection: sessions,
      }),
      getSessionKey: (ctx) => {
        console.log('GET SESSION KEY', ctx.from, ctx.chat);
        return ctx.from === undefined || ctx.chat === undefined
          ? undefined
          : `${ctx.chat.id}/${ctx.from.id}/${botId}`;
      },
    })
  );

  // Rate limit users to 60 messages per hour
  bot.use(
    limit({
      // Allow only 60 messages every hour
      timeFrame: 3600000,
      limit: 60,

      storageClient: redis,

      alwaysReply: false,
      // This is called when the limit is exceeded.
      onLimitExceeded: async (ctx) => {
        console.log(`RATE LIMITING ${ctx.msg?.sender_chat?.username}`);
        // if the bot is mentioned or replied to, reply to the message
        await ctx.reply(
          getTooManyRequestsReplyMessage(ctx.from?.username || 'loserpants')
        );
      },

      // Note that the key should be a number in string format such as "123456789".
      keyGenerator: (ctx) => {
        // Skip rate limiting if not directed to the bot
        if (ctx.chat?.type === 'private') {
          // Always rate limit private chats
          console.log('RATE LIMITING PRIVATE CHAT', ctx.msg?.sender_chat?.id);
          return ctx.msg?.sender_chat?.id.toString() || ctx.from?.id.toString();
        }

        console.log('RATE LIMITING GROUP CHAT', ctx.msg?.sender_chat?.id);
        // Check if bot is mentioned in group chats
        const isBotMentioned = ctx.message?.entities?.some(
          (entity) =>
            entity.type === 'mention' &&
            ctx.message?.text?.substring(
              entity.offset,
              entity.offset + entity.length
            ) === `@${bot.botInfo.username}`
        );

        // Check if message is replying to the bot
        const isReplyToBot =
          ctx.message?.reply_to_message?.from?.id === bot.botInfo.id;

        // Only return a key (enabling rate limiting) if the message is directed to the bot
        if (isBotMentioned || isReplyToBot) {
          return ctx.msg?.sender_chat?.id.toString() || ctx.from?.id.toString();
        }

        // Return undefined to skip rate limiting for messages not directed to the bot
        return undefined;
      },
    })
  );

  // Add middleware to handle user/chat creation and management
  bot.use(async (ctx, next) => {
    console.log('MIDCURVE BOT MIDDLEWARE sessions');
    // Only proceed if we have both chatId and userId
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;
    const session = await ctx.session;

    if (!chatId || !userId || !ctx.from?.username) {
      console.error(
        `Missing expected info for user ${ctx.from?.id} in chat ${ctx.chat?.id}`
      );
      return next();
    }

    // Always fetch the latest user data from the database
    session.user =
      (await userService.findUser({ telegramId: userId })) ||
      (await userService.createUser({
        telegramId: userId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      }));

    // Always fetch the latest chat data
    session.chat =
      (await chatService.findChat({
        telegramChatId: chatId,
      })) ||
      (await chatService.createChat({
        telegramChatId: chatId,
        title: ctx.chat?.title,
        type: ctx.chat?.type || 'private',
        userIds: [userId],
        telegramBotId: botId,
      }));

    // Always fetch the latest agent data
    session.agent =
      (await agentService.findAgent({
        telegramBotId: botId,
      })) || undefined;

    // Load the last 10 messages for this chat if the messages array is empty
    if (!session.messages || session.messages.length === 0) {
      const messageService = await getMessageService();
      session.messages = await messageService.getMessagesByChatId(chatId, 10);
    }

    return next();
  });

  // Register command handlers
  await registerCommandHandlers(bot);

  bot.on('message', async (ctx) => {
    console.log('RECEIVED MESSAGE', ctx.message);
    const session = await ctx.session;
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;
    const updateId = ctx.update.update_id;

    console.log('SESSION', session);

    if (!chatId || !userId) {
      console.error('Missing chatId or userId');
      return;
    }

    // Only respond if bot is mentioned or in private chat or if replying to bot's message
    if (ctx.chat.type !== 'private') {
      const isBotMentioned = ctx.message.entities?.some(
        (entity) =>
          entity.type === 'mention' &&
          ctx.message.text?.substring(
            entity.offset,
            entity.offset + entity.length
          ) === `@${bot.botInfo.username}`
      );

      const isReplyToBot =
        ctx.message.reply_to_message?.from?.id === bot.botInfo.id;

      if (!isBotMentioned && !isReplyToBot) {
        return;
      }
    }

    try {
      const messageService = await getMessageService();
      const file = ctx.has(':file') ? await ctx.getFile() : undefined;
      let attachments: Attachment[] | undefined;

      if (
        file?.file_path &&
        file.file_size &&
        file.file_size <= MAX_BLOB_FILE_SIZE
      ) {
        // Add botId to the file object before processing
        const fileWithBotId = {
          ...file,
          bot_id: bot.botInfo.id.toString(),
        };
        attachments = await processAttachment(fileWithBotId);
      }

      const aiMessage = messageCtxToAiMessage(ctx, attachments);
      // Save the message to the database
      const userMessage = await messageService.createMessage({
        messageId: `user-${updateId}`,
        chatId,
        userId,
        role: 'user',
        content: aiMessage.content,
        attachments,
      });

      // Add the user message to the session messages
      session.messages.push(userMessage);
      // Keep only the last 10 messages
      if (session.messages.length > 10) {
        session.messages.shift();
      }

      const { text, completedToolInvocations, responseMessages } =
        await handleGenerateText({
          chatId,
          agentId: bot.botInfo.id,
          session,
        });
      const assistantMessages: MessageDTO[] = responseMessages.map(
        (message) => ({
          id: message.id,
          messageId: message.id,
          content: message.content,
          role: message.role,
          chatId,
          userId,
          attachments: message.experimental_attachments,
          createdAt: message.createdAt || new Date(),
        })
      );

      await messageService.createMessages(assistantMessages);

      // Add the assistant message to the session messages
      session.messages.push(...assistantMessages);
      // Keep only the last 10 messages
      if (session.messages.length > 10) {
        session.messages = session.messages.slice(-10);
      }

      if (completedToolInvocations) {
        for (const toolInvocation of completedToolInvocations) {
          switch (toolInvocation.toolName) {
            case 'getConnectLink': {
              try {
                // Handle both string and object responses
                let connectLink: string;

                if (typeof toolInvocation.result === 'string') {
                  try {
                    // Try to parse if it's a JSON string
                    const parsed = JSON.parse(toolInvocation.result);
                    connectLink = parsed.result;
                  } catch {
                    // If parsing fails, use the string directly
                    const { result } = parseJSON({
                      text: toolInvocation.result,
                      schema: z.object({
                        result: z.string(),
                      }),
                    });
                    connectLink = result;
                  }
                } else if (
                  toolInvocation.result &&
                  typeof toolInvocation.result === 'object'
                ) {
                  // Handle when result is already an object
                  connectLink = toolInvocation.result.result;
                } else {
                  throw new Error('Invalid connect link format');
                }

                console.log('Connect link', connectLink);
                return await ctx.api.sendMessage(userId, connectLink);
              } catch (error) {
                console.error('Error processing connect link:', error);
                await ctx.reply(
                  "Sorry, I couldn't generate a connection link. Please try again."
                );
                return;
              }
            }
            case 'image_generation_flux': {
              if (typeof toolInvocation.result === 'string') {
                const { result: imageUrl } = parseJSON({
                  text: toolInvocation.result,
                  schema: z.object({
                    result: z.string(),
                  }),
                });

                const prompt = toolInvocation.args.prompt;
                return await ctx.replyWithPhoto(imageUrl, {
                  caption: prompt,
                  caption_entities: [
                    {
                      type: 'italic',
                      offset: 0,
                      length: prompt.length,
                    },
                  ],
                });
              }
              break;
            }
          }
        }
      }

      await ctx.reply(text);
    } catch (error) {
      console.log('ERROR', error);
      console.error('Error handling message:', JSON.stringify(error, null, 2));

      // Select a random playful error message
      const randomMessage =
        REPLY_ERROR_MESSAGES[
          Math.floor(Math.random() * REPLY_ERROR_MESSAGES.length)
        ];

      await ctx.reply(randomMessage);
    }
  });

  return bot;
};

// Extract attachment processing to a separate function
async function processAttachment(
  file: TelegramFile & { download: () => Promise<string>; bot_id?: string }
): Promise<Attachment[] | undefined> {
  try {
    if (!file.file_path) {
      throw new Error('File path is missing');
    }

    const fileExt = extname(file.file_path);

    // Download file as buffer
    const tempFilePath = await file.download();
    const fileBuffer = readFileSync(tempFilePath);

    const fileName = `${file.file_id}${fileExt}`;
    // Use the bot_id passed from the context, or extract from file_id as fallback
    const botId = file.bot_id || file.file_id.split('_')[0];
    const blobPath = `tg/${botId}-${fileName}`;

    // Upload to blob storage
    const { contentDisposition, downloadUrl, contentType } = await put(
      blobPath,
      fileBuffer,
      {
        access: 'public',
      }
    );

    // Clean up the temporary file
    unlinkSync(tempFilePath);

    return [
      {
        url: downloadUrl,
        name: contentDisposition.split('filename=')[1],
        contentType,
      },
    ];
  } catch (error) {
    console.error('Error processing attachment:', error);
    return undefined;
  }
}
