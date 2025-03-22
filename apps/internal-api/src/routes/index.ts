import express from 'express';
import type { Request, Response } from 'express';
import { redisClient } from '../index.js';

const router = express.Router();

// Route that returns data from Redis
router.get('/data/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'Key parameter is required' });
    }

    const data = await redisClient.get(key);
    res.json({ data: data || 'No data found' });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Route that stores data in Redis
router.post('/data', async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    await redisClient.set(key, JSON.stringify(value));
    res
      .status(201)
      .json({ success: true, message: 'Data stored successfully' });
  } catch (error) {
    console.error('Error storing data:', error);
    res.status(500).json({ error: 'Failed to store data' });
  }
});

// Route that appends data to an existing string in Redis
router.post('/data/:key/append', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, maxItems } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // Get existing data
    const existingData = await redisClient.get(key);
    let dataArray = [];

    if (existingData) {
      try {
        dataArray = JSON.parse(existingData);
        if (!Array.isArray(dataArray)) {
          dataArray = [dataArray];
        }
      } catch (e) {
        // If not valid JSON, treat as a single item
        dataArray = [existingData];
      }
    }

    // Add new value to the beginning (most recent first)
    dataArray.unshift(value);

    // Limit to maxItems if specified (keep most recent items)
    if (maxItems && typeof maxItems === 'number' && maxItems > 0) {
      dataArray = dataArray.slice(0, maxItems);
    }

    // Store the updated array
    await redisClient.set(key, JSON.stringify(dataArray));

    res.status(200).json({
      success: true,
      message: 'Data appended successfully',
      newLength: dataArray.length,
      itemsKept: maxItems
        ? Math.min(maxItems, dataArray.length)
        : dataArray.length,
    });
  } catch (error) {
    console.error('Error appending data:', error);
    res.status(500).json({ error: 'Failed to append data' });
  }
});

// Route that increments a numeric value in Redis
router.post('/data/:key/increment', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { by = 1 } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key parameter is required' });
    }

    const newValue = await redisClient.incrBy(key, by);
    res.status(200).json({
      success: true,
      message: 'Value incremented successfully',
      newValue,
    });
  } catch (error) {
    console.error('Error incrementing value:', error);
    res.status(500).json({ error: 'Failed to increment value' });
  }
});

// Route that decrements a numeric value in Redis
router.post('/data/:key/decrement', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { by = 1 } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key parameter is required' });
    }

    const newValue = await redisClient.decrBy(key, by);
    res.status(200).json({
      success: true,
      message: 'Value decremented successfully',
      newValue,
    });
  } catch (error) {
    console.error('Error decrementing value:', error);
    res.status(500).json({ error: 'Failed to decrement value' });
  }
});

// Route that sets a key with expiration time
router.post('/data/expire', async (req: Request, res: Response) => {
  try {
    const { key, value, expireSeconds } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    if (!expireSeconds || typeof expireSeconds !== 'number') {
      return res.status(400).json({ error: 'Valid expireSeconds is required' });
    }

    await redisClient.setEx(key, expireSeconds, JSON.stringify(value));
    res.status(201).json({
      success: true,
      message: 'Data stored with expiration successfully',
    });
  } catch (error) {
    console.error('Error storing data with expiration:', error);
    res.status(500).json({ error: 'Failed to store data with expiration' });
  }
});

// Route that deletes a key from Redis
router.delete('/data/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'Key parameter is required' });
    }

    const deleted = await redisClient.del(key);
    res.json({
      success: true,
      message: deleted ? 'Key deleted successfully' : 'Key not found',
    });
  } catch (error) {
    console.error('Error deleting key:', error);
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

// Route that gets the last used tools
router.get('/last-used-tools', async (req: Request, res: Response) => {
  try {
    // Get the limit parameter from query string or default to 10
    const limit = req.query.limit
      ? Number.parseInt(req.query.limit as string, 10)
      : 10;

    // Get data from Redis
    const data = await redisClient.get('last_used_tools');
    let toolsArray = [];

    if (data) {
      try {
        toolsArray = JSON.parse(data);
        if (!Array.isArray(toolsArray)) {
          toolsArray = [toolsArray];
        }
      } catch (e) {
        console.error('Error parsing tools data:', e);
        return res.status(500).json({ error: 'Invalid data format' });
      }
    }

    // Return only the requested number of items
    const limitedTools = toolsArray.slice(0, limit);

    res.json({
      tools: limitedTools,
      total: toolsArray.length,
      limit,
    });
  } catch (error) {
    console.error('Error fetching last used tools:', error);
    res.status(500).json({ error: 'Failed to fetch last used tools' });
  }
});

export default router;
