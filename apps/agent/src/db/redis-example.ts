import redisClient from './redis';
import type { DataMetadata, StructuredData } from './redis';

/**
 * This file demonstrates how to use the Redis client to interact with the internal API
 */

async function redisExamples() {
  try {
    // Basic set and get operations
    await redisClient.set('simple_key', 'simple_value');
    const simpleValue = await redisClient.get('simple_key');
    console.log('Simple value:', simpleValue);

    // Working with objects
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    };
    await redisClient.set('user:1', user);
    const retrievedUser = await redisClient.get('user:1');
    console.log('Retrieved user:', retrievedUser);

    // Using expiration
    await redisClient.setEx('temp_key', 60, 'I will expire in 60 seconds');
    const tempValue = await redisClient.get('temp_key');
    console.log('Temporary value:', tempValue);

    // Appending data to an array
    await redisClient.set('logs', ['Initial log entry']);
    await redisClient.append('logs', 'Second log entry');
    await redisClient.append('logs', 'Third log entry', 10); // Keep only the 10 most recent entries
    const logs = await redisClient.get('logs');
    console.log('Logs:', logs);

    // Incrementing/decrementing counters
    await redisClient.set('counter', 10);
    const incremented = await redisClient.incrBy('counter', 5);
    console.log('Incremented counter:', incremented); // 15
    
    const decremented = await redisClient.decrBy('counter', 3);
    console.log('Decremented counter:', decremented); // 12

    // Structured data with metadata
    const postData = {
      title: 'Using Redis with TypeScript',
      content: 'This is a tutorial on using Redis with TypeScript',
      tags: ['redis', 'typescript', 'tutorial']
    };
    
    const metadata: DataMetadata = {
      author: 'John Doe',
      category: 'Programming',
      isPublished: true
    };
    
    await redisClient.setStructured('post:1', postData, metadata);
    const post = await redisClient.getStructured<typeof postData>('post:1');
    console.log('Post with metadata:', post);
    
    // Checking if a key exists
    const exists = await redisClient.exists('post:1');
    console.log('Post:1 exists:', exists);
    
    // Working with multiple keys at once
    await redisClient.mset({
      'multi:1': 'First value',
      'multi:2': 'Second value',
      'multi:3': 'Third value'
    });
    
    const multiValues = await redisClient.mget(['multi:1', 'multi:2', 'multi:3']);
    console.log('Multiple values:', multiValues);
    
    // Deleting a key
    await redisClient.del('temp_key');
    const deletedValue = await redisClient.get('temp_key');
    console.log('Deleted value (should be null):', deletedValue);
    
    // Getting last used tools (for specific API)
    const lastTools = await redisClient.getLastUsedTools(5);
    console.log('Last 5 used tools:', lastTools);

  } catch (error) {
    console.error('Error in Redis examples:', error);
  }
}

// Execute examples if this file is run directly
if (require.main === module) {
  redisExamples()
    .then(() => console.log('Redis examples completed'))
    .catch(error => console.error('Redis examples failed:', error));
}

export default redisExamples; 