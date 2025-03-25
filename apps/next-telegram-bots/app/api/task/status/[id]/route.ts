import { type NextRequest, NextResponse } from 'next/server';

import { getTaskService } from '@/lib/services';
import { TaskStatus } from '@/lib/services/tasks.service';
import { authenticateRequest } from '@/lib/verify-auth-token';

export const PUT = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { isValid, error } = await authenticateRequest(req);
    if (!isValid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const data = await req.json();

    if (!data.status || !Object.values(TaskStatus).includes(data.status)) {
      return NextResponse.json(
        {
          error: 'Invalid status value',
          validValues: Object.values(TaskStatus),
        },
        { status: 400 }
      );
    }

    // The service now handles all state validation and timestamps
    const taskService = await getTaskService();
    const result = await taskService.updateTaskStatus(id, data.status);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to update task status',
          currentTask: result.task,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result.task, { status: 200 });
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json(
      { error: 'Failed to update task status', details: error },
      { status: 500 }
    );
  }
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
