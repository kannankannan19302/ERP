const Redis = require('redis');
const config = require('./index');
const logger = require('../utils/logger');

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = Redis.createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        keyPrefix: config.redis.keyPrefix,
        retryDelayOnFailover: config.redis.retryDelayOnFailover,
        enableReadyCheck: config.redis.enableReadyCheck,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Test the connection
      await this.client.ping();
      
      return this.client;
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected. Call connect() first.');
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  // Cache helper methods
  async get(key) {
    try {
      const client = this.getClient();
      return await client.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const client = this.getClient();
      if (ttl) {
        return await client.setEx(key, ttl, value);
      } else {
        return await client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      const client = this.getClient();
      return await client.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      const client = this.getClient();
      return await client.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async expire(key, ttl) {
    try {
      const client = this.getClient();
      return await client.expire(key, ttl);
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  async incr(key) {
    try {
      const client = this.getClient();
      return await client.incr(key);
    } catch (error) {
      logger.error('Redis INCR error:', error);
      return null;
    }
  }

  async decr(key) {
    try {
      const client = this.getClient();
      return await client.decr(key);
    } catch (error) {
      logger.error('Redis DECR error:', error);
      return null;
    }
  }

  // Hash operations
  async hget(key, field) {
    try {
      const client = this.getClient();
      return await client.hGet(key, field);
    } catch (error) {
      logger.error('Redis HGET error:', error);
      return null;
    }
  }

  async hset(key, field, value) {
    try {
      const client = this.getClient();
      return await client.hSet(key, field, value);
    } catch (error) {
      logger.error('Redis HSET error:', error);
      return false;
    }
  }

  async hgetall(key) {
    try {
      const client = this.getClient();
      return await client.hGetAll(key);
    } catch (error) {
      logger.error('Redis HGETALL error:', error);
      return {};
    }
  }

  async hdel(key, field) {
    try {
      const client = this.getClient();
      return await client.hDel(key, field);
    } catch (error) {
      logger.error('Redis HDEL error:', error);
      return false;
    }
  }

  // List operations
  async lpush(key, value) {
    try {
      const client = this.getClient();
      return await client.lPush(key, value);
    } catch (error) {
      logger.error('Redis LPUSH error:', error);
      return false;
    }
  }

  async rpush(key, value) {
    try {
      const client = this.getClient();
      return await client.rPush(key, value);
    } catch (error) {
      logger.error('Redis RPUSH error:', error);
      return false;
    }
  }

  async lpop(key) {
    try {
      const client = this.getClient();
      return await client.lPop(key);
    } catch (error) {
      logger.error('Redis LPOP error:', error);
      return null;
    }
  }

  async rpop(key) {
    try {
      const client = this.getClient();
      return await client.rPop(key);
    } catch (error) {
      logger.error('Redis RPOP error:', error);
      return null;
    }
  }

  async lrange(key, start, stop) {
    try {
      const client = this.getClient();
      return await client.lRange(key, start, stop);
    } catch (error) {
      logger.error('Redis LRANGE error:', error);
      return [];
    }
  }

  // Set operations
  async sadd(key, member) {
    try {
      const client = this.getClient();
      return await client.sAdd(key, member);
    } catch (error) {
      logger.error('Redis SADD error:', error);
      return false;
    }
  }

  async srem(key, member) {
    try {
      const client = this.getClient();
      return await client.sRem(key, member);
    } catch (error) {
      logger.error('Redis SREM error:', error);
      return false;
    }
  }

  async smembers(key) {
    try {
      const client = this.getClient();
      return await client.sMembers(key);
    } catch (error) {
      logger.error('Redis SMEMBERS error:', error);
      return [];
    }
  }

  async sismember(key, member) {
    try {
      const client = this.getClient();
      return await client.sIsMember(key, member);
    } catch (error) {
      logger.error('Redis SISMEMBER error:', error);
      return false;
    }
  }

  // Pub/Sub operations
  async publish(channel, message) {
    try {
      const client = this.getClient();
      return await client.publish(channel, message);
    } catch (error) {
      logger.error('Redis PUBLISH error:', error);
      return false;
    }
  }

  async subscribe(channel, callback) {
    try {
      const client = this.getClient();
      await client.subscribe(channel, callback);
    } catch (error) {
      logger.error('Redis SUBSCRIBE error:', error);
    }
  }

  async unsubscribe(channel) {
    try {
      const client = this.getClient();
      await client.unsubscribe(channel);
    } catch (error) {
      logger.error('Redis UNSUBSCRIBE error:', error);
    }
  }

  // Cache with JSON serialization
  async setJSON(key, value, ttl = null) {
    try {
      const serialized = JSON.stringify(value);
      return await this.set(key, serialized, ttl);
    } catch (error) {
      logger.error('Redis setJSON error:', error);
      return false;
    }
  }

  async getJSON(key) {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis getJSON error:', error);
      return null;
    }
  }

  // Pattern-based operations
  async keys(pattern) {
    try {
      const client = this.getClient();
      return await client.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS error:', error);
      return [];
    }
  }

  async deletePattern(pattern) {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        const client = this.getClient();
        return await client.del(keys);
      }
      return 0;
    } catch (error) {
      logger.error('Redis deletePattern error:', error);
      return 0;
    }
  }

  // Cache statistics
  async getStats() {
    try {
      const client = this.getClient();
      const info = await client.info();
      return {
        connected: this.isConnected,
        info: info
      };
    } catch (error) {
      logger.error('Redis getStats error:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // Flush operations
  async flushdb() {
    try {
      const client = this.getClient();
      return await client.flushDb();
    } catch (error) {
      logger.error('Redis FLUSHDB error:', error);
      return false;
    }
  }

  async flushall() {
    try {
      const client = this.getClient();
      return await client.flushAll();
    } catch (error) {
      logger.error('Redis FLUSHALL error:', error);
      return false;
    }
  }
}

// Create singleton instance
const redisManager = new RedisManager();

module.exports = redisManager;