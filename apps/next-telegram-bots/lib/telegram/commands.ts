import { getBaseUrl } from '@/lib/config';
import { getUserService } from '@/lib/services';
import type { MyBot, MyContext } from '@/lib/telegram/types';
import { encryptUserId } from '@/lib/telegram/utils';
import { type CommandContext, InlineKeyboard } from 'grammy';

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

  const userService = await getUserService();
  console.log('UserService initialized');

  let user = await userService.findUser({ telegramId });
  console.log('User search result:', user);

  if (!user) {
    console.log(`user ${telegramId} not found, creating new user`);
    user = await userService.createUser({
      telegramId,
      firstName,
      username,
    });
    console.log(`new user ${user.id} created`);
  } else {
    console.log(`user ${user.id} exists`);
  }
}

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
    const uniswapLink =
      'https://app.uniswap.org/swap?chain=base&inputCurrency=ETH&outputCurrency=0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b';

    const keyboard = new InlineKeyboard()
      .url('🔗 Connect Wallet', link)
      .row()
      .url('💰 Buy $MCRV', uniswapLink)
      .row()
      .url('📺 Watch Live', 'https://midcurve.live');

    // Send the image as a DM
    await ctx.api.sendPhoto(
      userId,
      'https://lvjt7wkmlmpwhrpm.public.blob.vercel-storage.com/midcurve-diagram-banner-wide-6BMVgW6A0qpQQB0bth2ND7KYf4hO8k.png',
      {
        caption: `👋 *GM ${firstNameClean}*\\!

Welcome to *Midcurve\\.live* \\- your 24/7 livestreamed AI Agent\\!

Midcurve engages, researches, and trades based on *your* inputs\\:

1️⃣ Connect your EVM wallet to participate
2️⃣ Buy & hold $MCRV tokens to gain influence
3️⃣ Shape agent decisions in real\\-time

Join the community now\\!`,
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
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply("Sorry, I couldn't identify your user account.");
      return;
    }

    const link = `${getBaseUrl()}/connect/${encryptUserId(userId)}`;
    const uniswapLink =
      'https://app.uniswap.org/swap?chain=base&inputCurrency=ETH&outputCurrency=0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b';

    const keyboard = new InlineKeyboard()
      .url('🔗 Connect Wallet', link)
      .row()
      .url('💰 Buy $MCRV', uniswapLink)
      .row()
      .url('📺 Watch Live', 'https://midcurve.live');

    await ctx.api.sendMessage(
      userId,
      `🔍 *Midcurve\\.live Commands*

• /start \\- Welcome message & information
• /mcrv \\- Connect & Purchase $MCRV tokens
• /help \\- Show this help menu

📝 *About Midcurve\\.live*

• 24/7 livestreamed AI Agent
• Community\\-driven research & trading
• $MCRV token holders influence decisions
• Real\\-time interaction with the AI

Need help? Use the support button below\\!`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error('Error handling /help command:', error);
    await ctx.reply(
      "We're preparing Midcurve.live for launch! Stay tuned and come back soon!"
    );
  }
}

export async function handleMcrvCommand(
  ctx: CommandContext<MyContext>
): Promise<void> {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply("Sorry, I couldn't identify your user account.");
      return;
    }

    const link = `${getBaseUrl()}/connect/${encryptUserId(userId)}`;
    const uniswapLink =
      'https://app.uniswap.org/swap?chain=base&inputCurrency=ETH&outputCurrency=0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b';

    const keyboard = new InlineKeyboard()
      .url('💰 Buy on Uniswap', uniswapLink)
      .row()
      .url('🔗 Connect Wallet', link);

    await ctx.api.sendPhoto(
      userId,
      'https://lvjt7wkmlmpwhrpm.public.blob.vercel-storage.com/midcurve-diagram-banner-wide-6BMVgW6A0qpQQB0bth2ND7KYf4hO8k.png',
      {
        caption: `💰 *$MCRV Tokens*

The key to participating in the Midcurve ecosystem:

• Buy $MCRV to influence AI decisions
• More tokens \\= stronger influence
• Connect your wallet to participate
• Be part of cutting\\-edge AI trading

Ready to get started? Use the buttons below\\!`,
        parse_mode: 'MarkdownV2',
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error('Error handling /mcrv command:', error);
    await ctx.reply(
      'Sorry, I encountered an error processing your command. Please try again later.'
    );
  }
}

export async function registerCommandHandlers(bot: MyBot): Promise<void> {
  try {
    bot.command('start', handleStartCommand);
    bot.command('mcrv', handleMcrvCommand);
    bot.command('help', handleHelpCommand);

    await bot.api.setMyCommands([
      { command: 'start', description: 'Get started' },
      { command: 'mcrv', description: 'Connect & Purchase $MCRV' },
      { command: 'help', description: 'Show help text' },
    ]);
  } catch (error) {
    console.error('Error setting commands:', error);
  }
}
