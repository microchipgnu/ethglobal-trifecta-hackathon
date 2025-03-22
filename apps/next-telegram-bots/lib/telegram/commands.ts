import { getBaseUrl } from '@/lib/config';
import { userService } from '@/lib/services';
import type { MyBot, MyContext } from '@/lib/telegram/types';
import { encryptUserId } from '@/lib/telegram/utils';
import { InlineKeyboard } from 'grammy';
import type { CommandContext } from 'grammy';

export async function ensureUserExists(
  ctx: CommandContext<MyContext>
): Promise<void> {
  const telegramId = ctx.from?.id;
  const firstName = ctx.from?.first_name || 'there';
  const username = ctx.from?.username;

  console.log('ensureUserExists called with:', {
    telegramId,
    firstName,
    username,
  });

  if (!telegramId) {
    console.error("No telegramId found in context, new User can't be created");
    return;
  }

  const service = await userService();
  console.log('UserService initialized');

  let user = await service.findUser({ telegramId });
  console.log('User search result:', user);

  if (!user) {
    console.log('User not found, creating new user');
    user = await service.createUser({
      telegramId,
      firstName,
      username,
    });
    console.log('New user created:', user);
  } else {
    console.log('User already exists:', user);
  }
}

const alphaNumericRegex = /^[a-zA-Z0-9]+$/;

export async function handleStartCommand(
  ctx: CommandContext<MyContext>
): Promise<void> {
  try {
    await ensureUserExists(ctx);
    const firstName = ctx.from?.first_name || 'there';
    const firstNameClean = firstName.replace(/[^a-zA-Z0-9]/g, '');
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply("Sorry, I couldn't identify your user account.");
      return;
    }

    const link = `${getBaseUrl()}/connect/${encryptUserId(userId)}`;
    const tgLink = 'https://t.me/midcurvelive';
    const followOnXLink = 'https://x.com/0xSoko';

    const keyboard = new InlineKeyboard()
      .url('Register & Buy $MCRV', link)
      .row()
      .url('Join the Community', tgLink)
      .row()
      .url('Follow on X', followOnXLink);

    // Send the image as a DM
    await ctx.api.sendPhoto(
      userId,
      'https://pbs.twimg.com/profile_banners/1815217701058682880/1737510246/1500x500',
      {
        caption: `👋 *GM ${firstNameClean}*,

Welcome to *Midcurve\\.live*\\! 

Midcurve is a 24/7 livestreamed AI Agent that engages, researches, and trades based on live community inputs\\!

1\\. Register & Buy $MCRV to participate\\!

2\\. Join our Community\\!

3\\. Influence Midcurve's decisions in real\\-time\\!`,
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error('Error handling /start command:', error);
    await ctx.reply('Sorry, I encountered an error processing your command.');
  }
}

export async function handleGettingStarted(
  ctx: CommandContext<MyContext>
): Promise<void> {
  try {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply("Sorry, I couldn't identify your user account.");
      return;
    }

    const tgLink = 'https://t.me/midcurvelive';
    const followOnXLink = 'https://x.com/microchipgnu';

    const keyboard = new InlineKeyboard()
      .url('Watch Livestream', 'https://midcurve.live')
      .row()
      .url('Join Community', tgLink)
      .row()
      .url('Follow on X', followOnXLink);

    // Send the image
    await ctx.replyWithPhoto(
      'https://pbs.twimg.com/profile_banners/1815217701058682880/1737510246/1500x500',
      {
        caption:
          '✅ *You have successfully registered\\! Welcome to Midcurve\\.live\\!*\n\n' +
          'You can now participate in the 24/7 livestreamed AI Agent ecosystem\\.\n\n' +
          'Watch the livestream, engage with the community, and influence Midcurve\'s decisions in real\\-time\\!',
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error('Error handling /start command:', error);
    await ctx.reply('Sorry, I encountered an error processing your command.');
  }
}

export async function handleHelpCommand(
  ctx: CommandContext<MyContext>
): Promise<void> {
  try {
    await ctx.reply(
      '🔍 *Available Commands:*\n\n• `/start` \\- Start or restart the bot\n• `/register` \\- Register and link your wallet\n• `/buy` \\- Purchase $MCRV tokens\n• `/help` \\- Show this help menu\n\n📝 *About Midcurve\\.live:*\n\n• Midcurve is a 24/7 livestreamed AI Agent\n• Community members can influence Midcurve\'s research and trading\n• Buy $MCRV tokens to participate in the ecosystem\n\nIf you have any issues, contact us at support@midcurve\\.live',
      { parse_mode: 'MarkdownV2' }
    );
  } catch (error) {
    console.error('Error handling /help command:', error);
    await ctx.reply(
      'We\'re preparing Midcurve.live for launch! Stay tuned and come back soon!'
    );
  }
}

export async function handleConnectCommand(
  ctx: CommandContext<MyContext>
): Promise<void> {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply("Sorry, I couldn't identify your user account.");
      return;
    }

    const link = `${getBaseUrl()}/connect/${encryptUserId(userId)}`;
    await ctx.api.sendMessage(
      userId,
      `🔗 *Register your wallet*\n\nClick the link below to connect your wallet to your Telegram account and participate in the Midcurve ecosystem:\n\n[Connect Wallet](${link})`,
      {
        parse_mode: 'MarkdownV2',
      }
    );
  } catch (error) {
    console.error('Error handling /connect command:', error);
    await ctx.reply(
      'Sorry, I encountered an error processing your command. Please try again later.'
    );
  }
}

export async function registerCommandHandlers(bot: MyBot): Promise<void> {
  try {
    bot.command('start', handleStartCommand);
    bot.command('register', handleConnectCommand);
    bot.command('buy', handleBuyTokens);
    bot.command('help', handleHelpCommand);

    await bot.api.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'register', description: 'Register & Link Wallet' },
      { command: 'buy', description: 'Buy $MCRV Tokens' },
      { command: 'help', description: 'Show help text' },
    ]);
  } catch (error) {
    console.error('Error setting commands:', error);
  }
}

export async function handleBuyTokens(
  ctx: CommandContext<MyContext>
): Promise<void> {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply("Sorry, I couldn't identify your user account.");
      return;
    }

    const link = `${getBaseUrl()}/connect/${encryptUserId(userId)}`;
    await ctx.api.sendMessage(
      userId,
      `💰 *Buy $MCRV Tokens*\n\nClick the link below to purchase $MCRV tokens and participate in the Midcurve ecosystem:\n\n[Buy $MCRV](${link})`,
      {
        parse_mode: 'MarkdownV2',
      }
    );
  } catch (error) {
    console.error('Error handling /buy command:', error);
    await ctx.reply(
      'Sorry, I encountered an error processing your command. Please try again later.'
    );
  }
}
