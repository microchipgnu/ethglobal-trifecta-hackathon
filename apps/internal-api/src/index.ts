import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import { createClient } from 'redis';
import routes from './routes/index.js';

// Load environment variables
config();

const app = express();
const PORT = Number(process.env.INTERNAL_API_PORT) || 3000;
const HOST = process.env.INTERNAL_API_HOST || '0.0.0.0';

// Redis client setup
const redisUrl = process.env.REDIS_PASSWORD
  ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
  : `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().catch(console.error);

// Make redis client available to routes
export { redisClient };

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

// API routes
app.use('/api', routes);

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Internal API running on http://${HOST}:${PORT}`);
});
