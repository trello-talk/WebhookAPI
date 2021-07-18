import Redis from 'ioredis';

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

export const setCache = async (key: Redis.KeyType, value: Redis.ValueType) => {
  if (available) return client.set(key, value, 'EX', 60 * 60);
};

export const getCache = async (key: Redis.KeyType) => {
  if (available) return await client.get(key);
};
