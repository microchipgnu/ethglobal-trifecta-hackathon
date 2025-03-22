import { z } from 'zod';
import { createDocument } from 'zod-openapi';

import { getBaseUrl } from '@/lib/config';
import { agentDTOSchema } from '@/lib/services/agent.service';
import { userDTOSchema } from '@/lib/services/user.service';

export const openApiSpec = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Midcurve.live Telegram Bots API',
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
    schemas: {
      AgentStats: {
        type: 'object',
        properties: {
          pings: {
            type: 'number',
            description: 'Number of times the agent has been pinged',
            default: 0,
          },
          balance: {
            type: 'number',
            description: "Agent's current balance in ETH",
            default: 0,
          },
          exp: {
            type: 'number',
            description: "Agent's experience points",
            default: 0,
          },
          level: {
            type: 'number',
            description: "Agent's current level",
            default: 0,
          },
          cost: {
            type: 'number',
            description: "Agent's operation cost",
            default: 0,
          },
        },
      },
      Agent: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: "Agent's unique identifier",
          },
          name: {
            type: 'string',
            description: "Agent's name",
          },
          description: {
            type: 'string',
            description: 'Detailed description of the agent',
          },
          systemPrompt: {
            type: 'string',
            description: "System prompt for the agent's behavior",
          },
          imageUrl: {
            type: 'string',
            description: "URL to the agent's image",
          },
          telegramBotToken: {
            type: 'string',
            description: 'Telegram bot token for the agent',
          },
          telegramBotId: {
            type: 'number',
            description: 'Telegram bot ID for the agent',
          },
          telegramBotUsername: {
            type: 'string',
            description: 'Telegram bot username for the agent',
          },
          telegramBotCreatorId: {
            type: 'number',
            description: 'Telegram ID of the bot creator',
          },
          evmAddress: {
            type: 'string',
            description: 'EVM address associated with the agent',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
          stats: {
            $ref: '#/components/schemas/AgentStats',
            description: "Agent's statistics",
          },
          transactions: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'List of transaction IDs associated with the agent',
          },
          tools: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'List of tools available to the agent',
          },
        },
        required: [
          'id',
          'name',
          'systemPrompt',
          'telegramBotToken',
          'telegramBotId',
          'stats',
        ],
      },
    },
  },
  paths: {
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
                schema: agentDTOSchema,
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
              schema: agentDTOSchema.omit({
                id: true,
                telegramBotId: true,
                createdAt: true,
                updatedAt: true,
                telegramBotCreatorId: true,
              }),
            },
          },
          description: 'Agent data to create',
        },
        responses: {
          201: {
            description: 'Agent created successfully',
            content: {
              'application/json': {
                schema: agentDTOSchema,
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
            name: 'telegramBotId',
            in: 'query',
            schema: {
              type: 'number',
            },
            description: 'Telegram bot ID associated with the agent',
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
                schema: agentDTOSchema,
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
                  items: agentDTOSchema,
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
      post: {
        operationId: 'createUser',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: userDTOSchema.omit({
                id: true,
                createdAt: true,
                updatedAt: true,
              }),
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
              schema: userDTOSchema.partial().omit({
                id: true,
                createdAt: true,
                updatedAt: true,
              }),
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
  },
});
