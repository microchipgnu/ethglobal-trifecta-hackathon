// Listen to the queue for new messages
// Get the last message from the queue
// Execute the message
// Update the state
// Send the response

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
