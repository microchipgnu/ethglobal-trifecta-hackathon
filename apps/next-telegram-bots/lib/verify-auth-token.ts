import { NEXT_TG_BEARER_TOKEN } from '@/lib/config';
import type { NextRequest } from 'next/server';

export const authenticateRequest = async (
  req: NextRequest
): Promise<{
  isValid: boolean;
  error?: string;
}> => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { isValid: false, error: 'BEARER_TOKEN_MISSING' };
  }

  const bearerToken = authHeader.substring(7);
  const isValid = bearerToken === NEXT_TG_BEARER_TOKEN;

  if (!isValid) {
    return { isValid: false, error: 'BEARER_TOKEN_INVALID' };
  }

  return { isValid: true };
};
