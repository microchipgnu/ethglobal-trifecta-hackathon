export const DATABASE_NAME = 'midcurve';
export const AGENTS_COLLECTION = 'agents';
export const CHATS_COLLECTION = 'chats';
export const MESSAGES_COLLECTION = 'messages';
export const USERS_COLLECTION = 'users';
export const SESSIONS_COLLECTION = 'sessions';

export const MAX_BLOB_FILE_SIZE = 20 * 1024 * 1024;

export const AGENT_WALLET_ADDRESS =
  '0x6942025BAdBd8EF351A7F9D14959ECd2A961205d';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

export const getRpcUrl = (chainId: number) => {
  if (!ALCHEMY_API_KEY) {
    throw new Error('ALCHEMY_API_KEY is not set');
  }
  if (chainId === 8453) {
    return `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  }
  if (chainId === 84532) {
    return `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  }
  throw new Error(`Unsupported chainId: ${chainId}`);
};
