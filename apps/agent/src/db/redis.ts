// Store data in Redis using our internal-api endpoints

// Default API URL - should be configured based on your environment
const API_BASE_URL = process.env.INTERNAL_API_URL || 'http://localhost:3030/api/';

export interface DataMetadata {
  createdAt?: string;
  lastUpdated?: string;
  [key: string]: any;
}

export interface StructuredData<T = any> {
  data: T;
  metadata?: DataMetadata;
}

// API response interfaces
interface GetDataResponse {
  data: string | null;
}

interface SuccessResponse {
  success: boolean;
  message?: string;
}

interface AppendResponse extends SuccessResponse {
  newLength: number;
  itemsKept?: number;
}

interface IncrementResponse extends SuccessResponse {
  newValue: number;
}

interface LastUsedToolsResponse {
  tools: any[];
  total: number;
  limit: number;
}

interface ExistsResponse {
  exists: boolean;
}

interface TtlResponse {
  ttl: number;
}

export class RedisClient {
  private apiUrl: string;

  constructor(apiUrl = API_BASE_URL) {
    this.apiUrl = apiUrl;
  }

  /**
   * Get data from Redis by key
   */
  async get(key: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/data/${key}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json() as GetDataResponse;
      if (responseData && responseData.data) {
        try {
          return JSON.parse(responseData.data);
        } catch (e) {
          return responseData.data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting data from Redis:', error);
      throw error;
    }
  }

  /**
   * Store data in Redis
   */
  async set(key: string, value: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json() as SuccessResponse;
      return responseData && responseData.success;
    } catch (error) {
      console.error('Error setting data in Redis:', error);
      throw error;
    }
  }

  /**
   * Store data with expiration time
   */
  async setEx(key: string, expireSeconds: number, value: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/data/expire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          expireSeconds
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json() as SuccessResponse;
      return responseData && responseData.success;
    } catch (error) {
      console.error('Error setting data with expiration in Redis:', error);
      throw error;
    }
  }

  /**
   * Append data to an array
   */
  async append(key: string, value: any, maxItems?: number): Promise<number> {
    try {
      const response = await fetch(`${this.apiUrl}/data/${key}/append`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value,
          maxItems
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json() as AppendResponse;
      return responseData.newLength;
    } catch (error) {
      console.error('Error appending data in Redis:', error);
      throw error;
    }
  }

  /**
   * Increment a numeric value
   */
  async incrBy(key: string, by = 1): Promise<number> {
    try {
      const response = await fetch(`${this.apiUrl}/data/${key}/increment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          by
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json() as IncrementResponse;
      return responseData.newValue;
    } catch (error) {
      console.error('Error incrementing value in Redis:', error);
      throw error;
    }
  }

  /**
   * Decrement a numeric value
   */
  async decrBy(key: string, by = 1): Promise<number> {
    try {
      const response = await fetch(`${this.apiUrl}/data/${key}/decrement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          by
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json() as IncrementResponse;
      return responseData.newValue;
    } catch (error) {
      console.error('Error decrementing value in Redis:', error);
      throw error;
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/data/${key}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json() as SuccessResponse;
      return responseData && responseData.success;
    } catch (error) {
      console.error('Error deleting key from Redis:', error);
      throw error;
    }
  }

  /**
   * Store structured data with metadata
   */
  async setStructured<T>(key: string, data: T, metadata: DataMetadata = {}): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/data/structured`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          data,
          metadata
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json() as SuccessResponse;
      return responseData && responseData.success;
    } catch (error) {
      console.error('Error storing structured data in Redis:', error);
      throw error;
    }
  }

  /**
   * Update structured data
   */
  async updateStructured<T>(key: string, data: T, metadata: DataMetadata = {}): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/data/structured/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          metadata
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json() as SuccessResponse;
      return responseData && responseData.success;
    } catch (error) {
      console.error('Error updating structured data in Redis:', error);
      throw error;
    }
  }

  /**
   * Get the last used tools
   */
  async getLastUsedTools(limit = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/last-used-tools?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json() as LastUsedToolsResponse;
      return responseData.tools || [];
    } catch (error) {
      console.error('Error getting last used tools from Redis:', error);
      throw error;
    }
  }

  /**
   * Get structured data by key
   * This is a helper method that retrieves data and assumes it follows the StructuredData format
   */
  async getStructured<T>(key: string): Promise<StructuredData<T> | null> {
    try {
      const data = await this.get(key);
      if (!data) return null;
      
      // Check if the data follows the StructuredData format
      if (data && typeof data === 'object' && 'data' in data && 'metadata' in data) {
        return data as StructuredData<T>;
      }
      
      // If not, wrap it in StructuredData format
      return {
        data: data as T,
        metadata: {
          retrievedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error getting structured data from Redis:', error);
      throw error;
    }
  }

  /**
   * Check if a key exists in Redis
   */
  async exists(key: string): Promise<boolean> {
    try {
      const data = await this.get(key);
      return data !== null;
    } catch (error) {
      console.error('Error checking key existence in Redis:', error);
      return false;
    }
  }

  /**
   * Save multiple key-value pairs at once
   */
  async mset(pairs: Record<string, any>): Promise<boolean> {
    try {
      // Use Promise.all to set values in parallel
      const results = await Promise.all(
        Object.entries(pairs).map(([key, value]) => this.set(key, value))
      );
      
      // Check if all operations were successful
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error setting multiple values in Redis:', error);
      throw error;
    }
  }

  /**
   * Get multiple values at once
   */
  async mget(keys: string[]): Promise<Record<string, any>> {
    try {
      // Use Promise.all to get values in parallel
      const results = await Promise.all(
        keys.map(async key => {
          const value = await this.get(key);
          return { key, value };
        })
      );
      
      // Convert array of results to an object
      return results.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      console.error('Error getting multiple values from Redis:', error);
      throw error;
    }
  }
}

// Export a default instance to use
const redisClient = new RedisClient();
export default redisClient;

