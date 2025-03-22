import { MONGODB_URI, NODE_ENV } from '@/lib/config';
import { DATABASE_NAME } from '@/lib/constants';
import { MongoClient, type MongoClientOptions } from 'mongodb';

if (!MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const options: MongoClientOptions = {
  appName: 'midcurve-tg-bots',
  connectTimeoutMS: 5000, // Fail connection attempt after 5 seconds
  socketTimeoutMS: 45000, // Timeout socket operations after 45 seconds
};

let client: MongoClient;
let isConnected = false;

if (NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  // biome-ignore lint/style/useConst: global
  let globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
    _isConnected?: boolean;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(MONGODB_URI, options);
    globalWithMongo._isConnected = false;
  }
  client = globalWithMongo._mongoClient;
  isConnected = globalWithMongo._isConnected || false;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI, options);
}

// Connect to MongoDB with retry logic
export const connect = async (): Promise<MongoClient> => {
  if (isConnected) {
    return client;
  }

  try {
    await client.connect();

    // Update connection status
    if (NODE_ENV === 'development') {
      (global as typeof globalThis & { _isConnected?: boolean })._isConnected =
        true;
    }
    isConnected = true;

    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

// Ping MongoDB to check connection
export const ping = async (): Promise<boolean> => {
  try {
    if (!isConnected) {
      await connect();
    }

    await client.db(DATABASE_NAME).command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('MongoDB ping failed:', error);
    return false;
  }
};

// Export a module-scoped MongoClient. By doing this in a
// separate module, the client can be shared across functions.
export default client;
