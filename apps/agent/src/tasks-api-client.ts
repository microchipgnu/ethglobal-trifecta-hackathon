import type { GenerateTextResult, ToolSet } from 'ai';

/**
 * Task Status enum values
 */
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

/**
 * Task interface representing a task entity
 */
export interface Task {
  id: string;
  creatorTelegramId: number;
  creatorTelegramUsername: string;
  creatorEVMAddress: string;
  prompt: string;
  status: TaskStatusType;
  startedAt?: Date | null;
  completedAt?: Date | null;
  summary?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Task DTO interface
 */
export interface CreateTaskDTO {
  creatorTelegramId: number;
  creatorTelegramUsername: string;
  creatorEVMAddress: string;
  prompt: string;
}

/**
 * Update Task DTO interface
 */
export interface UpdateTaskDTO {
  status?: TaskStatusType;
  summary?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Task status update response
 */
export interface UpdateTaskStatusResponse {
  success: boolean;
  task: Task | null;
  error?: string;
}

/**
 * API Response types
 */
interface ApiTaskResponse {
  id: string;
  creatorTelegramId: number;
  creatorTelegramUsername: string;
  creatorEVMAddress: string;
  prompt: string;
  status: TaskStatusType;
  startedAt?: string | null;
  completedAt?: string | null;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiTasksResponse extends Array<ApiTaskResponse> {}

interface ApiDeleteResponse {
  success: boolean;
}

interface ApiUpdateTaskStatusResponse {
  success: boolean;
  task: ApiTaskResponse | null;
  error?: string;
}

/**
 * TasksClient class for interacting with the tasks API
 */
class TasksClient {
  private apiUrl: string;
  private bearerToken: string;

  constructor(apiUrl: string, bearerToken: string) {
    this.apiUrl = apiUrl;
    this.bearerToken = bearerToken;
  }

  /**
   * Get all tasks
   */
  async getAllTasks(options?: {
    status?: TaskStatusType;
    order?: 'asc' | 'desc';
    limit?: number;
  }): Promise<Task[]> {
    let url = `${this.apiUrl}/tasks`;

    // Add query parameters if provided
    if (options) {
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.order) params.append('order', options.order);
      if (options.limit) params.append('limit', options.limit.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = (await response.json()) as ApiTasksResponse;
    return this.parseTaskDates(data);
  }

  /**
   * Get a task by ID
   */
  async getTaskById(id: string): Promise<Task> {
    const response = await fetch(`${this.apiUrl}/task?id=${id}`, {
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch task: ${response.statusText}`);
    }

    const data = (await response.json()) as ApiTaskResponse;
    return this.parseTaskDates(data);
  }

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    const response = await fetch(`${this.apiUrl}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.bearerToken}`,
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }

    const data = (await response.json()) as ApiTaskResponse;
    return this.parseTaskDates(data);
  }

  /**
   * Update a task's status
   */
  async updateTaskStatus(
    id: string,
    status: TaskStatusType,
    summary?: string
  ): Promise<UpdateTaskStatusResponse> {
    const response = await fetch(`${this.apiUrl}/task/status?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.bearerToken}`,
      },
      body: JSON.stringify({ status, summary }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update task status: ${response.statusText}`);
    }

    const data = (await response.json()) as ApiUpdateTaskStatusResponse;

    // Convert the task if it exists
    const parsedResponse: UpdateTaskStatusResponse = {
      success: data.success,
      task: data.task ? this.parseTaskDates(data.task) : null,
      error: data.error,
    };

    return parsedResponse;
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/task?id=${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }

    const data = (await response.json()) as ApiDeleteResponse;
    return data.success;
  }

  /**
   * Parse date strings into Date objects
   */
  private parseTaskDates(task: ApiTaskResponse): Task;
  private parseTaskDates(tasks: ApiTaskResponse[]): Task[];
  private parseTaskDates(
    taskOrTasks: ApiTaskResponse | ApiTaskResponse[]
  ): Task | Task[] {
    if (Array.isArray(taskOrTasks)) {
      return taskOrTasks.map((task) => this.parseTaskDates(task));
    }

    const task = { ...taskOrTasks };
    return {
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      startedAt: task.startedAt ? new Date(task.startedAt) : null,
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
    };
  }
}

export default TasksClient;
