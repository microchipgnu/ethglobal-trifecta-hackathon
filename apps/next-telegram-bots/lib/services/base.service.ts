import { type Db, MongoClient } from 'mongodb';

import { DATABASE_NAME } from '@/lib/constants';

export class BaseService {
  protected readonly db: Db;

  constructor(mongoClient: MongoClient) {
    this.db = mongoClient.db(DATABASE_NAME);
  }
}
