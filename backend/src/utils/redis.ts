import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient: ReturnType<typeof createClient> | null = null;
let isRedisConnected = false;

// In-memory fallback cache
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export const initRedis = async () => {
  try {
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on('error', (err) => {
      console.warn('Redis Client Error, falling back to memory cache:', err.message);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
      isRedisConnected = true;
    });

    await redisClient.connect();
  } catch (error) {
    console.warn('Could not initialize Redis client, using in-memory cache fallback.');
    isRedisConnected = false;
  }
};

export const cacheSet = async (key: string, value: string, ttlSeconds: number = 300): Promise<void> => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.setEx(key, ttlSeconds, value);
      return;
    } catch (err) {
      console.error('Error writing to Redis cache:', err);
    }
  }

  // Fallback to memory cache
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryCache.set(key, { value, expiresAt });
};

export const cacheGet = async (key: string): Promise<string | null> => {
  if (isRedisConnected && redisClient) {
    try {
      return await redisClient.get(key);
    } catch (err) {
      console.error('Error reading from Redis cache:', err);
    }
  }

  // Fallback to memory cache
  const item = memoryCache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return item.value;
};

export const cacheDel = async (key: string): Promise<void> => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
      console.error('Error deleting from Redis cache:', err);
    }
  }

  memoryCache.delete(key);
};

export const cacheClearPrefix = async (prefix: string): Promise<void> => {
  if (isRedisConnected && redisClient) {
    try {
      const keys = await redisClient.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return;
    } catch (err) {
      console.error('Error clearing keys with prefix from Redis:', err);
    }
  }

  // Memory cache fallback
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
};

// Periodic memory cache garbage collection
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (now > item.expiresAt) {
      memoryCache.delete(key);
    }
  }
}, 60000);
