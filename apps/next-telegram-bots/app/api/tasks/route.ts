import { type NextRequest, NextResponse } from 'next/server';

import { getTaskService } from '@/lib/services';
import { authenticateRequest } from '@/lib/verify-auth-token';

export const GET = async (req: NextRequest) => {
  try {
    const { isValid, error } = await authenticateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 });
    }
    const taskService = await getTaskService();
    const tasks = await taskService.getAllTasks();

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
