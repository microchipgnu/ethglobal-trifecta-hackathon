import { type NextRequest, NextResponse } from 'next/server';

import { getTaskService } from '@/lib/services';
import { TaskStatus } from '@/lib/services/tasks.service';
import { authenticateRequest } from '@/lib/verify-auth-token';

export const GET = async (req: NextRequest) => {
  try {
    const { isValid, error } = await authenticateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Get query parameters
    const status = req.nextUrl.searchParams.get('status') as
      | (typeof TaskStatus)[keyof typeof TaskStatus]
      | null;
    const orderParam = req.nextUrl.searchParams.get('order');
    const order = orderParam ? (orderParam as 'asc' | 'desc') : undefined;
    const limitParam = req.nextUrl.searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const taskService = await getTaskService();

    // If no query parameters are provided, get all tasks
    if (!status && !order && !limit) {
      const tasks = await taskService.getAllTasks();
      return NextResponse.json(tasks, { status: 200 });
    }

    // Otherwise, use findTasks with the provided parameters
    const tasks = await taskService.findTasks({
      ...(status && { filter: { status } }),
      order,
      limit,
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: error },
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
