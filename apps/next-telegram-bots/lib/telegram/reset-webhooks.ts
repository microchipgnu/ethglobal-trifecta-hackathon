import { GrammyError } from 'grammy';

import { TELEGRAM_SECRET_TOKEN, getBaseUrl } from '@/lib/config';
import { agentService } from '@/lib/services';
import { getBot } from '@/lib/telegram/bot';

async function handleRateLimit(
  retryAfter: number,
  extraBuffer = 0.5
): Promise<void> {
  const waitTime = (retryAfter + extraBuffer) * 1000;
  console.log(`Rate limited. Waiting ${waitTime}ms before retrying...`);
  return new Promise((resolve) => setTimeout(resolve, waitTime));
}

async function resetWebhooks(customBaseUrl?: string) {
  const allAgents = await (await agentService()).getAllAgents();
  const baseUrl = customBaseUrl || getBaseUrl();
  let successCount = 0;

  for (const { telegramBotToken } of allAgents) {
    const bot = await getBot(telegramBotToken);
    const botUrl = `${baseUrl}/api/bot/${telegramBotToken}`;

    try {
      await bot.api.setWebhook(botUrl, {
        secret_token: TELEGRAM_SECRET_TOKEN,
        drop_pending_updates: true,
        allowed_updates: ['message'],
      });
      successCount++;
    } catch (error) {
      if (
        error instanceof GrammyError &&
        error.error_code === 429 &&
        error.parameters?.retry_after
      ) {
        await handleRateLimit(error.parameters.retry_after);

        try {
          await bot.api.setWebhook(botUrl, {
            secret_token: TELEGRAM_SECRET_TOKEN,
            drop_pending_updates: true,
            allowed_updates: ['message'],
          });
          successCount++;
        } catch (retryError) {
          console.error(
            `Failed to set webhook after retry for bot ${telegramBotToken}:`,
            retryError
          );
        }
      } else {
        console.error(
          `Error setting webhook for bot ${telegramBotToken}:`,
          error
        );
      }
    }
  }

  console.log(`Reset ${successCount} webhooks to ${baseUrl}`);
  
  return {
    success: true,
    message: `Reset ${successCount} webhooks to ${baseUrl}`,
    count: successCount
  };
}

if (require.main === module) {
  await resetWebhooks()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error resetting webhooks:', error);
      process.exit(1);
    });
}

export { resetWebhooks };
