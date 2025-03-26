import { type Filter, ObjectId, type WithoutId } from 'mongodb';
import { z } from 'zod';

import { TASKS_COLLECTION } from '@/lib/constants';
import { BaseService } from '@/lib/services/base.service';
import { toObjectId } from '@/lib/telegram/utils';

// Task Status Enum
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// Define the status order priority
const statusOrder = {
  [TaskStatus.IN_PROGRESS]: 1,
  [TaskStatus.PENDING]: 2,
  [TaskStatus.COMPLETED]: 3,
  [TaskStatus.FAILED]: 4,
};

// Task Entity Schema
export const taskEntitySchema = z.object({
  _id: z.instanceof(ObjectId),
  creatorTelegramId: z.number(),
  creatorTelegramUsername: z.string(),
  creatorEVMAddress: z.string(),
  prompt: z.string(),
  status: z
    .enum([
      TaskStatus.PENDING,
      TaskStatus.IN_PROGRESS,
      TaskStatus.COMPLETED,
      TaskStatus.FAILED,
    ])
    .default(TaskStatus.PENDING),
  startedAt: z.date().optional().nullable(),
  completedAt: z.date().optional().nullable(),
  summary: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TaskEntity = z.infer<typeof taskEntitySchema>;

// Task DTO Schema
export const taskDTOSchema = z.object({
  ...taskEntitySchema.shape,
  id: z.string(),
});

export type TaskDTO = z.infer<typeof taskDTOSchema>;

// Task DTO Companion Object
export const TaskDTO = {
  convertFromEntity(entity: TaskEntity): TaskDTO {
    return taskDTOSchema.parse({
      ...entity,
      id: entity._id.toHexString(),
    });
  },
};

export const createTaskDTOSchema = taskDTOSchema.omit({
  _id: true,
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});
export type CreateTaskDTO = z.infer<typeof createTaskDTOSchema>;
export const CreateTaskDTO = {
  convertFromDTO(dto: CreateTaskDTO): WithoutId<TaskEntity> {
    const now = new Date();
    return {
      ...dto,
      createdAt: now,
      updatedAt: now,
      status: TaskStatus.PENDING,
    };
  },
};

export class TaskService extends BaseService {
  private getCollection() {
    return this.db.collection<WithoutId<TaskEntity>>(TASKS_COLLECTION);
  }
  async getAllTasks(): Promise<TaskDTO[]> {
    try {
      // Get all tasks
      const entities = await this.getCollection()
        .find({
          status: {
            $in: [TaskStatus.IN_PROGRESS, TaskStatus.PENDING],
          },
        })
        .sort({ createdAt: -1 })
        .toArray();

      return entities.map((entity: TaskEntity) =>
        TaskDTO.convertFromEntity(entity)
      );
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw error;
    }
  }

  async findTask(filter: Filter<TaskEntity>): Promise<TaskDTO | null> {
    try {
      const entity = await this.getCollection().findOne(filter);
      return entity ? TaskDTO.convertFromEntity(entity) : null;
    } catch (error) {
      console.error('Error finding task:', error);
      throw error;
    }
  }

  async findTasks({
    filter = {
      status: {
        $in: [TaskStatus.IN_PROGRESS, TaskStatus.PENDING],
      },
    },
    order = 'asc',
    limit = 5,
  }: {
    filter?: Filter<TaskEntity>;
    order?: 'asc' | 'desc';
    limit?: number;
  }): Promise<TaskDTO[]> {
    try {
      const entities = await this.getCollection()
        .find(filter)
        .sort({ createdAt: order === 'asc' ? 1 : -1 })
        .limit(limit)
        .toArray();

      // Sort tasks by status priority and then by createdAt
      const sortedEntities = entities.sort((a, b) => {
        // First sort by status priority
        const statusComparison = statusOrder[a.status] - statusOrder[b.status];
        if (statusComparison !== 0) return statusComparison;

        // Then sort by createdAt using the requested order
        return order === 'asc'
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime();
      });

      return sortedEntities.map((entity: TaskEntity) =>
        TaskDTO.convertFromEntity(entity)
      );
    } catch (error) {
      console.error('Error finding tasks:', error);
      throw error;
    }
  }

  async createTask(dto: CreateTaskDTO): Promise<TaskDTO> {
    try {
      const candidate = CreateTaskDTO.convertFromDTO(dto);

      const { insertedId } = await this.getCollection().insertOne(candidate);
      const entity: TaskEntity = {
        ...candidate,
        _id: insertedId,
      };
      return TaskDTO.convertFromEntity(entity);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(
    filter: Filter<TaskEntity>,
    dto: Omit<Partial<TaskDTO>, 'id' | 'createdAt'>
  ): Promise<TaskDTO | null> {
    try {
      const now = new Date();

      // Create a clean version of the DTO without date fields that should be managed automatically
      const { startedAt, completedAt, ...cleanDto } = dto;

      const candidate = taskEntitySchema.partial().parse({
        ...cleanDto,
        updatedAt: now,
      });

      const entity = await this.getCollection().findOneAndUpdate(
        filter,
        { $set: candidate },
        { returnDocument: 'after' }
      );
      return entity ? TaskDTO.convertFromEntity(entity) : null;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      const result = await this.getCollection().deleteOne({
        _id: toObjectId(id),
      });
      return result.deletedCount === 1;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async findTasksByCreatorTelegramId(telegramId: number): Promise<TaskDTO[]> {
    try {
      const entities = await this.getCollection()
        .find({ creatorTelegramId: telegramId })
        .toArray();
      return entities.map((entity: TaskEntity) =>
        TaskDTO.convertFromEntity(entity)
      );
    } catch (error) {
      console.error('Error finding tasks by telegramId:', error);
      throw error;
    }
  }

  async updateTaskStatus(
    id: string,
    status: (typeof TaskStatus)[keyof typeof TaskStatus],
    summary?: string
  ): Promise<{ success: boolean; task: TaskDTO | null; error?: string }> {
    try {
      // First, get the current task to check its status
      const currentTask = await this.findTask({ _id: toObjectId(id) });
      if (!currentTask) {
        return { success: false, task: null, error: 'Task not found' };
      }

      const now = new Date();
      const updates: Partial<TaskEntity> = { status, summary };
      let validTransition = false;

      // Validate state transitions
      switch (status) {
        case TaskStatus.PENDING:
          // Can't move back to pending
          return {
            success: false,
            task: currentTask,
            error: 'Cannot move task back to pending state',
          };

        case TaskStatus.IN_PROGRESS:
          // Can only move to in_progress from pending
          if (currentTask.status === TaskStatus.PENDING) {
            validTransition = true;
            updates.startedAt = now;
            updates.summary = summary;
          } else {
            return {
              success: false,
              task: currentTask,
              error: 'Task can only be moved to in_progress from pending state',
            };
          }
          break;

        case TaskStatus.COMPLETED:
          // Can only complete from in_progress
          if (currentTask.status === TaskStatus.IN_PROGRESS) {
            validTransition = true;
            updates.completedAt = now;
            updates.summary = summary;
          } else {
            return {
              success: false,
              task: currentTask,
              error: 'Task can only be completed from in_progress state',
            };
          }
          break;

        case TaskStatus.FAILED:
          // Can fail from any state except completed
          if (currentTask.status !== TaskStatus.COMPLETED) {
            validTransition = true;
            // If it was in progress, set completedAt
            if (currentTask.status === TaskStatus.IN_PROGRESS) {
              updates.completedAt = now;
              updates.summary = summary;
            }
          } else {
            return {
              success: false,
              task: currentTask,
              error: 'Cannot mark a completed task as failed',
            };
          }
          break;

        default:
          return {
            success: false,
            task: currentTask,
            error: `Invalid status: ${status}`,
          };
      }

      if (validTransition) {
        const updatedTask = await this.updateTask(
          { _id: toObjectId(id) },
          updates
        );
        return { success: true, task: updatedTask };
      }

      return {
        success: false,
        task: currentTask,
        error: 'Invalid state transition',
      };
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }
}
