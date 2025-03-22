import { type NextRequest, NextResponse } from 'next/server';

import { agentService } from '@/lib/services';
import { agentDTOSchema } from '@/lib/services/agent.service';
import { getFilterFromSearchParams } from '@/lib/telegram/utils';
import { authenticateRequest } from '@/lib/verify-auth-token';

export const POST = async (req: NextRequest) => {
  try {
    const { isValid, error } = await authenticateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = await req.json();

    const agentData = agentDTOSchema
      .omit({
        id: true,
        telegramBotId: true,
        createdAt: true,
        updatedAt: true,
      })
      .parse(body);

    const agent = await (await agentService()).createAgent(agentData);

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent', details: error },
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

    const agent = await (await agentService()).findAgent(filter);
    return NextResponse.json(agent, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent', details: error },
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

    const agentData = agentDTOSchema
      .partial()
      .omit({
        id: true,
        telegramBotId: true,
        createdAt: true,
      })
      .parse(body);

    const filter = getFilterFromSearchParams(req.nextUrl.searchParams);
    if (!filter) {
      return NextResponse.json(
        { error: 'No filter params provided' },
        { status: 400 }
      );
    }

    const agent = await (await agentService()).updateAgent(filter, agentData);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(agent, { status: 200 });
  } catch (error) {
    console.error('Failed to update agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent', details: error },
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
