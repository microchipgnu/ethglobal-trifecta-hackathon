import { MONGODB_URI } from '@/lib/config';
import { DATABASE_NAME, USERS_COLLECTION } from '@/lib/constants';
import { MongoClient } from 'mongodb';

if (!MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const client = new MongoClient(MONGODB_URI, {
  appName: 'midcurve-tg-bots',
  connectTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

async function upgradeUsers() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db(DATABASE_NAME);
    const collection = database.collection(USERS_COLLECTION);

    // Update all documents to add the deposit field with an empty string if it doesn't exist
    const result = await collection.updateMany(
      { evmAddress: { $exists: false } },
      { $set: { evmAddress: '' } }
    );

    console.log(`${result.modifiedCount} documents were updated.`);
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

upgradeUsers().catch(console.error);
