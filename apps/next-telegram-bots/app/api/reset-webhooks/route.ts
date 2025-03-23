import { type NextRequest, NextResponse } from 'next/server';

import { resetWebhooks } from '@/lib/telegram/reset-webhooks';
import { authenticateRequest } from '@/lib/verify-auth-token';

export const POST = async (req: NextRequest) => {
  try {
    const { isValid, error } = await authenticateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Get the baseUrl from query parameters
    const baseUrl = req.nextUrl.searchParams.get('url');

    // Reset webhooks with the provided URL or use default
    const result = await resetWebhooks(baseUrl || undefined);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to reset webhooks:', error);

    return NextResponse.json(
      { error: 'Failed to reset webhooks', details: String(error) },
      { status: 500 }
    );
  }
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
