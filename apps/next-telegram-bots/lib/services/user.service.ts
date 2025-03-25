import { type Filter, ObjectId, type WithoutId } from 'mongodb';
import { z } from 'zod';

import { AGENT_WALLET_ADDRESS, USERS_COLLECTION } from '@/lib/constants';
import { BaseService } from '@/lib/services/base.service';
import { toObjectId } from '@/lib/telegram/utils';

// User Entity Schema
export const userEntitySchema = z.object({
  _id: z.instanceof(ObjectId),
  telegramId: z.number(),
  firstName: z.string(),
  username: z.string().optional(),
  evmAddress: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deposit: z.string().optional(),
  depositHash: z.string().optional(),
  depositAmount: z.number().optional(),
  totalRewards: z.number().default(0),
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
  convertFromDTO(dto: CreateUserDTO): UserDTO {
    const now = new Date();
    return userDTOSchema.parse({
      ...dto,
      createdAt: now,
      updatedAt: now,
    });
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
      return UserDTO.convertFromEntity({ ...candidate, _id: insertedId });
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

  async fetchDepositTransactions(): Promise<
    Array<{ from: string; value: string; hash: string }>
  > {
    try {
      const response = await fetch(
        `https://api.basescan.org/api?module=account&action=txlist&address=${AGENT_WALLET_ADDRESS}&startblock=0&endblock=latest&page=1&offset=100&sort=desc&apikey=${process.env.BASESCAN_API}`
      );
      const data = await response.json();

      if (data.status !== '1') {
        throw new Error('Failed to fetch transactions from Base Network');
      }

      return data.result
        .filter(
          (tx: {
            from: string;
            to: string;
            value: string;
            hash: string;
            txreceipt_status: string;
          }) =>
            tx.to.toLowerCase() === AGENT_WALLET_ADDRESS.toLowerCase() &&
            Number.parseFloat(tx.value) >= 0.001 &&
            tx.txreceipt_status === '1'
        )
        .map((tx: { from: string; value: string; hash: string }) => ({
          from: tx.from.toLowerCase(),
          value: tx.value,
          hash: tx.hash,
        }));
    } catch (error) {
      console.error('Failed to fetch deposit transactions:', error);
      throw error;
    }
  }

  async updateAllUserDeposits(): Promise<void> {
    try {
      const depositTxs = await this.fetchDepositTransactions();
      const users = await this.getAllUsers();

      for (const user of users) {
        if (!user.evmAddress) continue;

        const userDepositTx = depositTxs.find(
          (tx) => tx.from === user.evmAddress?.toLowerCase()
        );

        if (userDepositTx) {
          const depositAmount = Number.parseFloat(userDepositTx.value) / 1e18;
          await this.updateUser(
            { telegramId: user.telegramId },
            {
              depositHash: userDepositTx.hash,
              depositAmount: depositAmount,
            }
          );
        }
      }
    } catch (error) {
      console.error('Failed to update all user deposits:', error);
      throw error;
    }
  }

  async updateUserDeposit(
    telegramId: number,
    evmAddress: string
  ): Promise<{ success: boolean; deposit?: string; depositAmount?: number }> {
    try {
      const user = await this.findUserByEvmAddress(evmAddress);

      if (!user || user.telegramId !== telegramId) {
        throw new Error('User not found');
      }

      const response = await fetch(
        `https://api.basescan.org/api?module=account&action=txlist&address=${evmAddress}&startblock=0&endblock=latest&page=1&offset=2&sort=desc&apikey=${process.env.BASESCAN_API}`
      );
      const data = await response.json();

      if (data.status !== '1') {
        throw new Error('Failed to fetch transactions from Base Network');
      }

      const transactions = data.result;
      const matchingTx = transactions.find(
        (tx: {
          from: string;
          to: string;
          value: string;
          txreceipt_status: string;
          hash: string;
        }) =>
          tx.from.toLowerCase() === evmAddress.toLowerCase() &&
          tx.to.toLowerCase() === AGENT_WALLET_ADDRESS.toLowerCase() &&
          Number.parseFloat(tx.value) >= 5 &&
          tx.txreceipt_status === '1'
      );

      if (!matchingTx) {
        throw new Error('No deposit transaction has been found');
      }

      const depositAmount = Number.parseFloat(matchingTx.value) / 1e18;
      await this.updateUser(
        { telegramId },
        {
          depositHash: matchingTx.hash,
          depositAmount: depositAmount,
        }
      );

      return { success: true, deposit: matchingTx.hash, depositAmount };
    } catch (error) {
      console.error('Failed to update user deposit:', error);
      throw error;
    }
  }
}
