import { type NextRequest, NextResponse, after } from 'next/server';

import { TELEGRAM_SECRET_TOKEN } from '@/lib/config';
import { getBot } from '@/lib/telegram/bot';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, x-telegram-bot-api-secret-token',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
};

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ botToken: string }> }
) => {
  try {
    const botToken = (await params).botToken;

    if (!botToken) {
      return NextResponse.json(
        { ok: false, error: 'Bot token is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const bot = await getBot(botToken);

    const webhookInfo = await bot.api.getWebhookInfo();

    return NextResponse.json(
      {
        ok: true,
        botInfo: bot.botInfo,
        webhookInfo,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('Error in GET /api/bot/[botToken]:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

// POST endpoint for handling Telegram webhook callbacks
export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ botToken: string }> }
): Promise<NextResponse> => {
  try {
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
    const botToken = (await params).botToken;

    if (!botToken) {
      return NextResponse.json(
        { ok: false, error: 'Bot token is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate secret token
    if (secretToken !== TELEGRAM_SECRET_TOKEN) {
      console.error('Invalid secret token');
      return NextResponse.json(
        { ok: false, error: 'Invalid secret token' },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const [bot, update] = await Promise.all([getBot(botToken), req.json()]);

    // Process the update after the response is sent
    after(async () => {
      await bot.handleUpdate(update).catch((error) => {
        console.error('Error handling update:', error);
      });
    });

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Error in POST /api/bot/[botToken]:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
