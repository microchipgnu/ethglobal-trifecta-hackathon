import { type Filter, ObjectId, type WithoutId } from 'mongodb';
import { z } from 'zod';

import { CHATS_COLLECTION } from '@/lib/constants';
import { BaseService } from '@/lib/services/base.service';

// Chat Entity Schema
export const chatEntitySchema = z.object({
  _id: z.instanceof(ObjectId),
  telegramChatId: z.number(),
  title: z.string().optional().nullable(),
  type: z.string(),
  userIds: z.array(z.number()),
  telegramBotId: z.number(),
  summary: z.string().optional(),
  lastMessageAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ChatEntity = z.infer<typeof chatEntitySchema>;

// Chat DTO Schema
export const chatDTOSchema = z.object({
  id: z.string(),
  telegramChatId: chatEntitySchema.shape.telegramChatId,
  title: chatEntitySchema.shape.title,
  type: chatEntitySchema.shape.type,
  userIds: chatEntitySchema.shape.userIds,
  telegramBotId: chatEntitySchema.shape.telegramBotId,
  summary: chatEntitySchema.shape.summary,
  lastMessageAt: chatEntitySchema.shape.lastMessageAt,
  createdAt: chatEntitySchema.shape.createdAt,
  updatedAt: chatEntitySchema.shape.updatedAt,
});

export type ChatDTO = z.infer<typeof chatDTOSchema>;

// Chat DTO Companion Object
export const ChatDTO = {
  convertFromEntity(entity: ChatEntity): ChatDTO {
    return chatDTOSchema.parse({
      id: entity._id.toHexString(),
      telegramChatId: entity.telegramChatId,
      title: entity.title,
      type: entity.type,
      userIds: entity.userIds,
      telegramBotId: entity.telegramBotId,
      summary: entity.summary,
      lastMessageAt: entity.lastMessageAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  },
};

export class ChatService extends BaseService {
  private getChatsCollection() {
    return this.db.collection<WithoutId<ChatEntity>>(CHATS_COLLECTION);
  }

  async findChat(filter: Filter<ChatEntity>): Promise<ChatDTO | null> {
    console.log('DB FETCHING CHAT', filter);
    const entity = await this.getChatsCollection().findOne(filter);
    return entity ? ChatDTO.convertFromEntity(entity) : null;
  }

  async createChat(
    dto: Omit<
      ChatDTO,
      'id' | 'summary' | 'lastMessageAt' | 'createdAt' | 'updatedAt'
    >
  ): Promise<ChatDTO> {
    const now = new Date();
    const candidate = chatEntitySchema
      .omit({
        _id: true,
      })
      .parse({
        ...dto,
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      });

    const { insertedId } = await this.getChatsCollection().insertOne(candidate);
    return ChatDTO.convertFromEntity({ ...candidate, _id: insertedId });
  }

  async updateChat(
    filter: Filter<ChatEntity>,
    dto: Omit<Partial<ChatDTO>, 'id' | 'createdAt'>
  ): Promise<ChatDTO | null> {
    const now = new Date();
    const candidate = chatEntitySchema.partial().parse({
      ...dto,
      updatedAt: now,
    });

    const entity = await this.getChatsCollection().findOneAndUpdate(
      filter,
      { $set: candidate },
      { returnDocument: 'after' }
    );
    return entity ? ChatDTO.convertFromEntity(entity) : null;
  }

  async updateSummary(
    chatId: number,
    summary: string
  ): Promise<ChatDTO | null> {
    return this.updateChat({ telegramChatId: chatId }, { summary });
  }

  async addUserToChat(chatId: number, userId: number): Promise<ChatDTO | null> {
    const entity = await this.getChatsCollection().findOneAndUpdate(
      { telegramChatId: chatId },
      {
        $addToSet: { userIds: userId },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    );
    return entity ? ChatDTO.convertFromEntity(entity) : null;
  }
}
