import { type Filter, ObjectId, type WithoutId } from 'mongodb';
import { z } from 'zod';

import { USERS_COLLECTION } from '@/lib/constants';
import { BaseService } from '@/lib/services/base.service';
import { toObjectId } from '@/lib/telegram/utils';

// User Entity Schema
export const userEntitySchema = z.object({
  _id: z.instanceof(ObjectId),
  telegramId: z.number(),
  firstName: z.string(),
  username: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  totalRewards: z.number().default(0),
  evmAddress: z.string().optional(),
  deposit: z.string().optional(),
  depositHash: z.string().optional(),
  depositAmount: z.number().optional(),
  rewardCooldownDate: z.date().optional().nullable(),
});

export type UserEntity = z.infer<typeof userEntitySchema>;

// User DTO Schema
export const userDTOSchema = z.object({
  ...userEntitySchema.shape,
  id: z.string(),
});

export type UserDTO = z.infer<typeof userDTOSchema>;

// User DTO Companion Object
export const UserDTO = {
  convertFromEntity(entity: UserEntity): UserDTO {
    return userDTOSchema.parse({
      ...entity,
      id: entity._id.toHexString(),
    });
  },
};

export const createUserDTOSchema = userDTOSchema.omit({
  _id: true,
  id: true,
  createdAt: true,
  updatedAt: true,
  deposit: true,
  evmAddress: true,
  totalRewards: true,
  rewardCooldownDate: true,
  depositHash: true,
  depositAmount: true,
});
export type CreateUserDTO = z.infer<typeof createUserDTOSchema>;
export const CreateUserDTO = {
  convertFromDTO(dto: CreateUserDTO): WithoutId<UserEntity> {
    const now = new Date();
    return {
      ...dto,
      createdAt: now,
      updatedAt: now,
      totalRewards: 0,
    };
  },
};

export class UserService extends BaseService {
  private getCollection() {
    return this.db.collection<WithoutId<UserEntity>>(USERS_COLLECTION);
  }

  async getAllUsers(): Promise<UserDTO[]> {
    try {
      const entities = await this.getCollection().find({}).toArray();
      return entities.map((entity: UserEntity) =>
        UserDTO.convertFromEntity(entity)
      );
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async findUser(filter: Filter<UserEntity>): Promise<UserDTO | null> {
    try {
      console.log('DB FETCHING USER', filter);
      const entity = await this.getCollection().findOne(filter);
      return entity ? UserDTO.convertFromEntity(entity) : null;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  async createUser(dto: CreateUserDTO): Promise<UserDTO> {
    try {
      const candidate = CreateUserDTO.convertFromDTO(dto);

      const { insertedId } = await this.getCollection().insertOne(candidate);
      const entity: UserEntity = {
        ...candidate,
        _id: insertedId,
      };
      return UserDTO.convertFromEntity(entity);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(
    filter: Filter<UserEntity>,
    dto: Omit<Partial<UserDTO>, 'id' | 'createdAt'>
  ): Promise<UserDTO | null> {
    try {
      const now = new Date();
      const candidate = userEntitySchema.partial().parse({
        ...dto,
        updatedAt: now,
      });

      const entity = await this.getCollection().findOneAndUpdate(
        filter,
        { $set: candidate },
        { returnDocument: 'after' }
      );
      return entity ? UserDTO.convertFromEntity(entity) : null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await this.getCollection().deleteOne({
        _id: toObjectId(id),
      });
      return result.deletedCount === 1;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async findUserByTelegramId(telegramId: number): Promise<UserDTO | null> {
    return this.findUser({ telegramId });
  }

  async findUserByEvmAddress(evmAddress: string): Promise<UserDTO | null> {
    return this.findUser({ evmAddress });
  }
}
