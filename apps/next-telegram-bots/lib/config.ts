import { type RequestConfig, Toolhouse } from '@toolhouseai/sdk';
import type { ToolSet } from 'ai';
import { DEPLOYMENT_URL } from 'vercel-url';

export const {
  TUNNEL_URL,
  NEXT_TG_BEARER_TOKEN,
  TELEGRAM_SECRET_TOKEN,
  TOOLHOUSE_API_KEY,
  MONGODB_URI,
  NODE_ENV,
  NEXT_TG_SECRET,
  SERVER_WALLET_SECRET,
  REDIS_URL,
} = process.env;

export const toolhouse = new Toolhouse({
  apiKey: TOOLHOUSE_API_KEY,
  provider: 'vercel',
});

export const getTools = async (
  bundle = 'funny-base',
  requestConfig: RequestConfig = {}
): Promise<ToolSet> => {
  return (await toolhouse.getTools(bundle, requestConfig)) as ToolSet;
};

const APP_URL = 'https://midcurve.live';
const isProduction = process.env.NODE_ENV === 'production';

export const getBaseUrl = () => {
  return isProduction
    ? APP_URL
    : TUNNEL_URL || DEPLOYMENT_URL || 'http://localhost:3000';
};

export const getBotUrl = (telegramBotToken: string) => {
  return `${getBaseUrl()}/api/bot/${telegramBotToken}`;
};
