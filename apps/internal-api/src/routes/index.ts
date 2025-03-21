import express from 'express';
import type { Request, Response } from 'express';
import { redisClient } from '../index.js';

const router = express.Router();

// Example route that returns data from Redis
router.get('/data', async (req: Request, res: Response) => {
  try {
    const data = await redisClient.get('example-key');
    res.json({ data: data || 'No data found' });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Example route that stores data in Redis
router.post('/data', async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    
    await redisClient.set(key, JSON.stringify(value));
    res.status(201).json({ success: true, message: 'Data stored successfully' });
  } catch (error) {
    console.error('Error storing data:', error);
    res.status(500).json({ error: 'Failed to store data' });
  }
});

export default router; 