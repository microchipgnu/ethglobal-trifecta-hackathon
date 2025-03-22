import { type Filter, ObjectId, type WithoutId } from 'mongodb';
import { z } from 'zod';

import { botTokenToAccount } from '@/lib/ai/agent-wallet';
import { TELEGRAM_SECRET_TOKEN, getBotUrl } from '@/lib/config';
import { AGENTS_COLLECTION } from '@/lib/constants';
import { BaseService } from '@/lib/services/base.service';
import { getBot } from '@/lib/telegram/bot';
import { toObjectId } from '@/lib/telegram/utils';

// Agent Entity Schema
export const agentEntitySchema = z.object({
  _id: z.instanceof(ObjectId),
  name: z.string(),
  systemPrompt: z.string(),
  telegramBotId: z.number(),
  telegramBotToken: z.string(),
  telegramBotUsername: z.string().optional(),
  telegramBotCreatorId: z.number().optional(),
  evmAddress: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  stats: z
    .object({
      pings: z.number().default(0),
      balance: z.number().default(0),
      exp: z.number().default(0),
      level: z.number().default(0),
      cost: z.number().default(0),
    })
    .optional(),
  transactions: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
});

export type AgentEntity = z.infer<typeof agentEntitySchema>;

// Agent DTO Schema
export const agentDTOSchema = z.object({
  id: z.string(),
  name: agentEntitySchema.shape.name,
  description: agentEntitySchema.shape.description,
  systemPrompt: agentEntitySchema.shape.systemPrompt,
  imageUrl: agentEntitySchema.shape.imageUrl,
  telegramBotToken: agentEntitySchema.shape.telegramBotToken,
  telegramBotId: agentEntitySchema.shape.telegramBotId,
  telegramBotUsername: agentEntitySchema.shape.telegramBotUsername,
  telegramBotCreatorId: agentEntitySchema.shape.telegramBotCreatorId,
  evmAddress: agentEntitySchema.shape.evmAddress,
  createdAt: agentEntitySchema.shape.createdAt,
  updatedAt: agentEntitySchema.shape.updatedAt,
  // stats
  stats: agentEntitySchema.shape.stats,
  // transactions
  transactions: agentEntitySchema.shape.transactions,
  // tools
  tools: agentEntitySchema.shape.tools,
});

export type AgentDTO = z.infer<typeof agentDTOSchema>;

// Agent DTO Companion Object
export const AgentDTO = {
  convertFromEntity(entity: AgentEntity): AgentDTO {
    return agentDTOSchema.parse({
      id: entity._id.toHexString(),
      name: entity.name,
      description: entity.description,
      systemPrompt: entity.systemPrompt,
      imageUrl: entity.imageUrl,
      telegramBotToken: entity.telegramBotToken,
      telegramBotId: entity.telegramBotId,
      telegramBotUsername: entity.telegramBotUsername,
      telegramBotCreatorId: entity.telegramBotCreatorId,
      evmAddress: entity.evmAddress,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      stats: entity.stats,
      transactions: entity.transactions,
      tools: entity.tools,
    });
  },
};

export class AgentService extends BaseService {
  private getCollection() {
    return this.db.collection<WithoutId<AgentEntity>>(AGENTS_COLLECTION);
  }

  async createAgent(
    dto: Omit<
      AgentDTO,
      | 'id'
      | 'telegramBotId'
      | 'createdAt'
      | 'updatedAt'
      | 'telegramBotCreatorId'
    >
  ): Promise<AgentDTO> {
    try {
      const dtoWithTelegramBotId = {
        ...dto,
        telegramBotId: Number.parseInt(dto.telegramBotToken.split(':')[0]),
        evmAddress: botTokenToAccount(dto.telegramBotToken).address,
      };
      const now = new Date();
      const candidate = agentEntitySchema
        .omit({
          _id: true,
        })
        .parse({
          ...dtoWithTelegramBotId,
          createdAt: now,
          updatedAt: now,
          stats: {
            pings: 0,
            balance: 0,
            exp: 0,
            level: 0,
            cost: 0,
          },
        });

      const { insertedId } = await this.getCollection().insertOne(candidate);
      const bot = await getBot(dto.telegramBotToken);

      // Set up the webhook for the Telegram bot
      await bot.api.setWebhook(getBotUrl(dto.telegramBotToken), {
        secret_token: TELEGRAM_SECRET_TOKEN,
        drop_pending_updates: true,
        allowed_updates: ['message'],
      });
      return AgentDTO.convertFromEntity({ ...candidate, _id: insertedId });
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  async findAgent(filter: Filter<AgentEntity>): Promise<AgentDTO | null> {
    try {
      console.log('DB FETCHING AGENT', filter);
      const entity = await this.getCollection().findOne(filter);
      return entity ? AgentDTO.convertFromEntity(entity) : null;
    } catch (error) {
      console.error('Error getting agent:', error);
      throw error;
    }
  }

  async getAllAgents(): Promise<AgentDTO[]> {
    try {
      const entities = await this.getCollection().find({}).toArray();
      return entities.map((entity: AgentEntity) =>
        AgentDTO.convertFromEntity(entity)
      );
    } catch (error) {
      console.error('Error getting all agents:', error);
      throw error;
    }
  }

  async updateAgent(
    filter: Filter<AgentEntity>,
    dto: Omit<Partial<AgentDTO>, 'id' | 'createdAt'>
  ): Promise<AgentDTO | null> {
    try {
      const now = new Date();
      const candidate = agentEntitySchema.partial().parse({
        ...dto,
        updatedAt: now,
      });

      const entity = await this.getCollection().findOneAndUpdate(
        filter,
        { $set: candidate },
        { returnDocument: 'after' }
      );
      return entity ? AgentDTO.convertFromEntity(entity) : null;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  async deleteAgent(id: string): Promise<boolean> {
    try {
      const result = await this.getCollection().deleteOne({
        _id: toObjectId(id),
      });
      return result.deletedCount === 1;
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }
}
