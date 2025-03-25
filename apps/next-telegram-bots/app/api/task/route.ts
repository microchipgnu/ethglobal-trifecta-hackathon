import { type NextRequest, NextResponse } from 'next/server';

import { getTaskService } from '@/lib/services';
import { toObjectId } from '@/lib/telegram/utils';
import { authenticateRequest } from '@/lib/verify-auth-token';

export const GET = async (req: NextRequest) => {
  try {
    const { isValid, error } = await authenticateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const creatorTelegramId = url.searchParams.get('creatorTelegramId');

    const taskService = await getTaskService();
    let task = null;

    if (id) {
      task = await taskService.findTask({ _id: toObjectId(id) });
    } else if (creatorTelegramId) {
      const telegramId = Number.parseInt(creatorTelegramId, 10);
      // Since we only need one task here, but the method returns an array,
      // we'll just get the first result
      const tasks = await taskService.findTasksByCreatorTelegramId(telegramId);
      task = tasks.length > 0 ? tasks[0] : null;
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task', details: error },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const { isValid, error } = await authenticateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const data = await req.json();
    const taskService = await getTaskService();
    const task = await taskService.createTask(data);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error },
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

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const data = await req.json();
    const taskService = await getTaskService();
    const task = await taskService.updateTask({ _id: toObjectId(id) }, data);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task', details: error },
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

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const taskService = await getTaskService();
    const success = await taskService.deleteTask(id);

    if (!success) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task', details: error },
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
