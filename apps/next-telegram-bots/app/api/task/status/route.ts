import { type NextRequest, NextResponse } from 'next/server';

import { getTaskService } from '@/lib/services';
import { authenticateRequest } from '@/lib/verify-auth-token';

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

    if (!data.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const taskService = await getTaskService();

    // Use the dedicated updateTaskStatus method with status and optional summary
    const result = await taskService.updateTaskStatus(
      id,
      data.status,
      data.summary
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
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
