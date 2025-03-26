import { z } from 'zod';
import { createDocument } from 'zod-openapi';

import { getBaseUrl } from '@/lib/config';
import {
  agentDTOSchema,
  agentEntitySchema,
  createAgentDTOSchema,
} from '@/lib/services/agent.service';
import {
  createTaskDTOSchema,
  taskDTOSchema,
  taskEntitySchema,
  TaskStatus,
} from '@/lib/services/tasks.service';
import {
  createUserDTOSchema,
  userDTOSchema,
  userEntitySchema,
} from '@/lib/services/user.service';

export const openApiSpec = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Midcurve.live Bots API',
    description: 'Midcurve.live Telegram Bots API reference',
    version: '1.0.0',
  },
  servers: [
    {
      url: `${getBaseUrl()}/api`,
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
  paths: {
    '/agents': {
      get: {
        operationId: 'getAllAgents',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Agents fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: agentEntitySchema,
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/agent': {
      get: {
        operationId: 'getAgent',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'query',
            schema: {
              type: 'string',
            },
            description: "Agent's unique identifier",
          },
          {
            name: 'telegramBotId',
            in: 'query',
            schema: {
              type: 'number',
            },
            description: 'Telegram bot ID associated with the agent',
          },
          {
            name: 'evmAddress',
            in: 'query',
            schema: {
              type: 'string',
            },
            description: 'EVM address associated with the agent',
          },
        ],
        responses: {
          200: {
            description: 'Agent fetched successfully',
            content: {
              'application/json': {
                schema: agentEntitySchema,
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'Agent not found',
          },
        },
      },
      post: {
        operationId: 'createAgent',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createAgentDTOSchema,
            },
          },
          description: 'Agent data to create',
        },
        responses: {
          201: {
            description: 'Agent created successfully',
            content: {
              'application/json': {
                schema: agentEntitySchema,
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
      put: {
        operationId: 'updateAgent',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'query',
            schema: {
              type: 'string',
            },
            description: "Agent's unique identifier",
          },
          {
            name: 'telegramBotUsername',
            in: 'query',
            schema: {
              type: 'string',
            },
            description: 'Telegram bot username associated with the agent',
          },
          {
            name: 'evmAddress',
            in: 'query',
            schema: {
              type: 'string',
            },
            description: 'EVM address associated with the agent',
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: agentDTOSchema.partial().omit({
                id: true,
                createdAt: true,
                updatedAt: true,
              }),
            },
          },
          description: 'Fields to update on the agent',
        },
        responses: {
          200: {
            description: 'Agent updated successfully',
            content: {
              'application/json': {
                schema: agentEntitySchema,
              },
            },
          },
          400: {
            description: 'Bad request',
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'Agent not found',
          },
        },
      },
      delete: {
        operationId: 'deleteAgent',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
            description: "Agent's unique identifier to delete",
          },
        ],
        responses: {
          200: {
            description: 'Agent deleted successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                }),
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'Agent not found',
          },
        },
      },
    },
    '/user': {
      get: {
        operationId: 'getUser',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'telegramId',
            in: 'query',
            schema: {
              type: 'number',
            },
          },
          {
            name: 'username',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'evmAddress',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'User fetched successfully',
            content: {
              'application/json': {
                schema: userEntitySchema,
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'User not found',
          },
        },
      },
      post: {
        operationId: 'createUser',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createUserDTOSchema,
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: userDTOSchema,
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
      put: {
        operationId: 'updateUser',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'telegramId',
            in: 'query',
            schema: {
              type: 'number',
            },
          },
          {
            name: 'username',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'evmAddress',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: createUserDTOSchema,
            },
          },
        },
        responses: {
          200: {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: userDTOSchema,
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'User not found',
          },
        },
      },
      delete: {
        operationId: 'deleteUser',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'User deleted successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                }),
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'User not found',
          },
        },
      },
    },
    '/users': {
      get: {
        operationId: 'getAllUsers',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Users fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: userDTOSchema,
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          500: {
            description: 'Failed to fetch users',
          },
        },
      },
    },
    '/user/check-deposit': {
      post: {
        operationId: 'checkDeposit',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  telegramId: {
                    type: 'number',
                    description: 'Telegram ID of the user',
                  },
                  evmAddress: {
                    type: 'string',
                    description: 'EVM address of the user',
                  },
                },
                required: ['telegramId', 'evmAddress'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Deposit checked successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    deposit: { type: 'string' },
                  },
                },
              },
            },
          },
          404: {
            description: 'User not found or no deposit transaction found',
          },
          500: {
            description: 'Failed to check deposit',
          },
        },
      },
    },
    '/user/evmAddress/{evmAddress}': {
      get: {
        operationId: 'getUserByEvmAddress',
        parameters: [
          {
            name: 'evmAddress',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'EVM address of the user',
          },
        ],
        responses: {
          200: {
            description: 'User fetched successfully',
            content: {
              'application/json': {
                schema: userDTOSchema,
              },
            },
          },
          404: {
            description: 'User not found',
          },
          500: {
            description: 'Failed to fetch user by address',
          },
        },
      },
    },
    '/reset-webhooks': {
      post: {
        operationId: 'resetWebhooks',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'url',
            in: 'query',
            schema: {
              type: 'string',
            },
            description:
              'Base URL to use for resetting webhooks. If not provided, the default from getBaseUrl() will be used.',
          },
        ],
        responses: {
          200: {
            description: 'Webhooks reset successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  message: z.string(),
                  count: z.number(),
                }),
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          500: {
            description: 'Failed to reset webhooks',
          },
        },
      },
    },
    '/tasks': {
      get: {
        operationId: 'getAllTasks',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: Object.values(TaskStatus),
            },
            description: 'Filter tasks by status',
          },
          {
            name: 'order',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
            },
            description: 'Sort order for results',
          },
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
            },
            description: 'Maximum number of tasks to return',
          },
        ],
        responses: {
          200: {
            description: 'Tasks fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: taskDTOSchema,
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          500: {
            description: 'Failed to fetch tasks',
          },
        },
      },
    },
    '/task': {
      get: {
        operationId: 'getTask',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'query',
            schema: {
              type: 'string',
            },
            description: "Task's unique identifier",
          },
          {
            name: 'creatorTelegramId',
            in: 'query',
            schema: {
              type: 'number',
            },
            description: 'Telegram ID of the task creator',
          },
        ],
        responses: {
          200: {
            description: 'Task fetched successfully',
            content: {
              'application/json': {
                schema: taskEntitySchema,
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'Task not found',
          },
        },
      },
      post: {
        operationId: 'createTask',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: createTaskDTOSchema,
            },
          },
          description: 'Task data to create',
        },
        responses: {
          201: {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: taskDTOSchema,
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
      put: {
        operationId: 'updateTask',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
            description: "Task's unique identifier",
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: taskDTOSchema.partial().omit({
                id: true,
                createdAt: true,
                updatedAt: true,
                startedAt: true,
                completedAt: true,
              }),
            },
          },
          description: 'Fields to update on the task',
        },
        responses: {
          200: {
            description: 'Task updated successfully',
            content: {
              'application/json': {
                schema: taskDTOSchema,
              },
            },
          },
          400: {
            description: 'Bad request',
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'Task not found',
          },
        },
      },
      delete: {
        operationId: 'deleteTask',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
            description: "Task's unique identifier to delete",
          },
        ],
        responses: {
          200: {
            description: 'Task deleted successfully',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                }),
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
          404: {
            description: 'Task not found',
          },
        },
      },
    },
  },
});
