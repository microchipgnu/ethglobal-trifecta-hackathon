import { executePrompt } from '.';
import TasksClient, { TaskStatus } from './tasks-api-client';

// Create tasks client instance
const BEARER_TOKEN = process.env.NEXT_TG_BEARER_TOKEN || '';
const MIDCURVE_API = 'https://bots.midcurve.live/api';
const tasksClient = new TasksClient(MIDCURVE_API, BEARER_TOKEN);

// Configuration for exponential backoff
const MIN_BACKOFF_MS = 3000; // Start with 3 seconds
const MAX_BACKOFF_MS = 60000; // Max 1 minute
const BACKOFF_FACTOR = 1.5; // Exponential factor

// Task timeout configuration (3 minutes)
const TASK_TIMEOUT_MS = 3 * 60 * 1000;

export const processTask = async () => {
  try {
    // First check for any IN_PROGRESS tasks
    const inProgressTasks = await tasksClient.getAllTasks({
      status: TaskStatus.IN_PROGRESS,
      limit: 1,
    });

    // If there's an in-progress task, continue with it
    if (inProgressTasks.length > 0) {
      const task = inProgressTasks[0];
      if (!task) {
        console.log('No task found in in-progress tasks');
        return false;
      }
      console.log(`Continuing in-progress task: ${task.id} ${task.prompt}`);

      // Check if task has been running for too long
      if (task.startedAt) {
        const startTime = new Date(task.startedAt).getTime();
        const currentTime = new Date().getTime();
        const elapsedTime = currentTime - startTime;

        if (elapsedTime > TASK_TIMEOUT_MS) {
          console.log(
            `Task ${task.id} has exceeded timeout (${TASK_TIMEOUT_MS / 1000} seconds). Marking as failed.`
          );
          await tasksClient.updateTaskStatus(
            task.id,
            TaskStatus.FAILED,
            'Task timed out after 3 minutes'
          );
          return true;
        }
      }

      // Execute the task
      const response = await executePrompt(task.prompt, {
        host: 'computer',
        port: 5900,
      });

      // Update task with results
      await tasksClient.updateTaskStatus(
        task.id,
        TaskStatus.COMPLETED,
        typeof response.text === 'string'
          ? response.text
          : JSON.stringify(response)
      );

      console.log(`Task ${task.id} completed successfully`);
      return true;
    }

    // If no in-progress tasks, fetch pending tasks
    const pendingTasks = await tasksClient.getAllTasks({
      status: TaskStatus.PENDING,
      limit: 1,
      order: 'asc',
    });

    if (pendingTasks.length === 0) {
      console.log('No pending tasks found');
      return false;
    }

    const task = pendingTasks[0];
    if (!task) {
      console.log('No task found in pending tasks');
      return false;
    }

    console.log(`Processing task: ${task.id} ${task.prompt}`);

    // Update task status to IN_PROGRESS
    await tasksClient.updateTaskStatus(
      task.id,
      TaskStatus.IN_PROGRESS,
      undefined
    );
    console.log('Task updated to IN_PROGRESS');

    // Create a timeout promise that will reject after TASK_TIMEOUT_MS
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Task execution timed out after ${TASK_TIMEOUT_MS / 1000} seconds`
          )
        );
      }, TASK_TIMEOUT_MS);
    });

    try {
      // Race the task execution against the timeout
      const response = await Promise.race([
        executePrompt(task.prompt, {
          host: 'computer',
          port: 5900,
        }),
        timeoutPromise,
      ]);

      // Update task with results
      await tasksClient.updateTaskStatus(
        task.id,
        TaskStatus.COMPLETED,
        typeof response.text === 'string'
          ? response.text
          : JSON.stringify(response)
      );

      console.log(`Task ${task.id} completed successfully`);
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      console.error(`Task execution failed or timed out: ${errorMessage}`);

      // Update task as failed
      await tasksClient.updateTaskStatus(
        task.id,
        TaskStatus.FAILED,
        `Task execution failed: ${errorMessage}`
      );

      console.log(`Task ${task.id} marked as FAILED due to timeout or error`);
      return true;
    }
  } catch (error) {
    console.error('Error in task execution:', error);
    return false;
  }
};

export const startTaskLoop = async () => {
  let backoffTime = MIN_BACKOFF_MS;

  while (true) {
    try {
      const taskProcessed = await processTask();

      if (taskProcessed) {
        // Reset backoff time if a task was processed
        backoffTime = MIN_BACKOFF_MS;
        // Immediately check for more tasks
        continue;
      }

      // No task was processed, apply backoff
      console.log(
        `No tasks to process. Waiting ${backoffTime / 1000} seconds before next check.`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffTime));

      // Increase backoff time for next iteration, capped at MAX_BACKOFF_MS
      backoffTime = Math.min(backoffTime * BACKOFF_FACTOR, MAX_BACKOFF_MS);
    } catch (error) {
      console.error('Error in task loop:', error);

      // If there's an error, wait using current backoff and increase it
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
      backoffTime = Math.min(backoffTime * BACKOFF_FACTOR, MAX_BACKOFF_MS);
    }
  }
};

startTaskLoop();
