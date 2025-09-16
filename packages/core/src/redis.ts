import { Redis, type RedisOptions } from 'ioredis';
import { Resource } from 'sst';

const redisConfig: RedisOptions & { host: string; port: number } = {
  host: Resource.Redis.host,
  port: Resource.Redis.port,
  username: Resource.Redis.username,
  password: Resource.Redis.password,
};

if (Resource.Redis.host !== 'localhost') {
  redisConfig.tls = { checkServerIdentity: () => undefined };
}

export const client = new Redis(redisConfig);
