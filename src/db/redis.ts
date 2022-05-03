import Redis, { RedisKey, RedisValue } from 'ioredis';

import { logger } from '../logger';
import Batcher from '../util/batcher';

export const client = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  keyPrefix: process.env.REDIS_PREFIX,
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true
});

export const subClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  keyPrefix: process.env.REDIS_PREFIX,
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true
});

export const available = process.env.REDIS_HOST && process.env.REDIS_PORT;

export const batchHandoffs = new Map<string, Batcher>();

subClient.on('message', (channel, message) => {
  const prefix = 'batch_handoff:';
  if (!channel.startsWith(prefix)) return;
  const id = channel.slice(prefix.length);
  if (batchHandoffs.has(id)) {
    logger.log(`Passed in a batch for ${id}`);
    batchHandoffs.get(id).add(JSON.parse(message));
  }
});

export const connect = async () => {
  if (available) {
    await client.connect();
    await subClient.connect();
  }
};

export const disconnect = () => {
  if (available) {
    client.disconnect();
    subClient.disconnect();
  }
};

export const setCache = async (key: RedisKey, value: RedisValue) => {
  if (available) return client.set(key, value, 'EX', 60 * 60);
};

export const getCache = async (key: RedisKey) => {
  if (available) return await client.get(key);
};
