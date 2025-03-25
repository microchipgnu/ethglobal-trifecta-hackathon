import { type Filter, ObjectId, type WithoutId } from 'mongodb';
import { z } from 'zod';

import { MESSAGES_COLLECTION } from '@/lib/constants';
import { BaseService } from '@/lib/services/base.service';
import { toObjectId } from '@/lib/telegram/utils';

// Message Entity Schema
export const messageEntitySchema = z.object({
  _id: z.instanceof(ObjectId),
  messageId: z.string(),
  chatId: z.number(),
  userId: z.number(),
  role: z.enum(['system', 'user', 'assistant', 'data']),
  content: z.string(),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        name: z.string().optional(),
        contentType: z.string().optional(),
      })
    )
    .optional(),
  createdAt: z.date(),
});

export type MessageEntity = z.infer<typeof messageEntitySchema>;

// Message DTO Schema
export const messageDTOSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  chatId: z.number(),
  userId: messageEntitySchema.shape.userId,
  role: messageEntitySchema.shape.role,
  content: messageEntitySchema.shape.content,
  attachments: messageEntitySchema.shape.attachments,
  createdAt: messageEntitySchema.shape.createdAt,
});

export type MessageDTO = z.infer<typeof messageDTOSchema>;

// Message DTO Companion Object
export const MessageDTO = {
  convertFromEntity(entity: MessageEntity): MessageDTO {
    return messageDTOSchema.parse({
      id: entity._id.toHexString(),
      messageId: entity.messageId,
      chatId: entity.chatId,
      userId: entity.userId,
      role: entity.role,
      content: entity.content,
      attachments: entity.attachments || undefined,
      createdAt: entity.createdAt,
    });
  },
};

export class MessageService extends BaseService {
  private getMessagesCollection() {
    return this.db.collection<WithoutId<MessageEntity>>(MESSAGES_COLLECTION);
  }

  async findMessage(filter: Filter<MessageEntity>): Promise<MessageDTO | null> {
    const entity = await this.getMessagesCollection().findOne(filter);
    return entity ? MessageDTO.convertFromEntity(entity) : null;
  }

  async createMessage(
    dto: Omit<MessageDTO, 'id' | 'createdAt'>
  ): Promise<MessageDTO> {
    const now = new Date();
    const candidate = messageEntitySchema.omit({ _id: true }).parse({
      ...dto,
      createdAt: now,
    });
    const { upsertedId } = await this.getMessagesCollection().updateOne(
      { _id: toObjectId(dto.messageId) },
      { $setOnInsert: candidate },
      { upsert: true }
    );

    return MessageDTO.convertFromEntity({
      ...candidate,
      _id: upsertedId || toObjectId(dto.messageId),
    });
  }

  async createMessages(
    dtos: Omit<MessageDTO, 'id' | 'createdAt'>[]
  ): Promise<boolean> {
    const now = new Date();
    const candidates = dtos.map((dto) => ({
      ...dto,
      createdAt: now,
    }));
    const { insertedIds } = await this.getMessagesCollection().insertMany(
      candidates.map((dto) => ({
        _id: toObjectId(dto.messageId),
        ...dto,
      }))
    );

    return true;
  }

  async getMessagesByChatId(
    chatId: number,
    limit = 50,
    skip = 0
  ): Promise<MessageDTO[]> {
    const entities = await this.getMessagesCollection()
      .find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Reverse the array to get ascending order for final output
    return entities.reverse().map(MessageDTO.convertFromEntity);
  }
}
