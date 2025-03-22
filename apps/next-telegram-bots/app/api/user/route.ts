import { type NextRequest, NextResponse } from 'next/server';

import { userService } from '@/lib/services';
import { userDTOSchema } from '@/lib/services/user.service';
import { getFilterFromSearchParams } from '@/lib/telegram/utils';
import { authenticateRequest } from '@/lib/verify-auth-token';

export const POST = async (req: NextRequest) => {
  try {
    const { isValid, error } = await authenticateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = await req.json();

    const userData = userDTOSchema
      .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      })
      .parse(body);

    const user = await (await userService()).createUser(userData);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);

    return NextResponse.json(
      { error: 'Failed to create user', details: String(error) },
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const filter = getFilterFromSearchParams(req.nextUrl.searchParams);
    if (!filter) {
      return NextResponse.json(
        { error: 'No filter params provided' },
        { status: 400 }
      );
    }

    const user = await (await userService()).findUser(filter);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user:', error);

    return NextResponse.json(
      { error: 'Failed to fetch user', details: String(error) },
      { status: 500 }
    );
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    const { isValid, error } = await authenticateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = await req.json();

    const userData = userDTOSchema
      .partial()
      .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      })
      .parse(body);

    const user = await (await userService()).updateUser(
      {
        telegramId: userData.telegramId,
      },
      userData
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Failed to update user:', error);

    return NextResponse.json(
      { error: 'Failed to update user', details: String(error) },
      { status: 500 }
    );
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const { isValid, error } = await authenticateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID must be provided' },
        { status: 400 }
      );
    }

    const success = await (await userService()).deleteUser(id);

    if (!success) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete user:', error);

    return NextResponse.json(
      { error: 'Failed to delete user', details: String(error) },
      { status: 500 }
    );
  }
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
