import { Context, Effect, Layer } from 'effect';
import { Redis, type RedisOptions } from 'ioredis';
import { Resource } from 'sst';

// Redis Service Interface
export interface RedisService {
  readonly get: (key: string) => Effect.Effect<string | null, RedisError>;
  readonly set: (
    key: string,
    value: string,
    ttlSeconds?: number,
  ) => Effect.Effect<void, RedisError>;
  readonly delete: (key: string) => Effect.Effect<void, RedisError>;
  readonly disconnect: () => Effect.Effect<void, RedisError>;
}

// Error types
export class RedisError extends Error {
  readonly _tag = 'RedisError';
  constructor(
    readonly cause: unknown,
    message?: string,
  ) {
    super(message ?? 'Redis operation failed');
  }
}

// Service tag
export const RedisService = Context.GenericTag<RedisService>('RedisService');

// Implementation
const makeRedisService = Effect.gen(function* () {
  // Create Redis configuration
  const redisConfig: RedisOptions & { host: string; port: number } = {
    host: Resource.Redis.host,
    port: Resource.Redis.port,
    username: Resource.Redis.username,
    password: Resource.Redis.password,
  };

  if (Resource.Redis.host !== 'localhost') {
    redisConfig.tls = { checkServerIdentity: () => undefined };
  }

  // Create Redis client
  const client = new Redis(redisConfig);

  // Implement service methods
  const get = (key: string) =>
    Effect.tryPromise(() => client.get(key)).pipe(
      Effect.mapError(
        (error) => new RedisError(error, `Failed to get key: ${key}`),
      ),
    );

  const set = (key: string, value: string, ttlSeconds?: number) =>
    Effect.tryPromise(() => {
      if (ttlSeconds) {
        return client.set(key, value, 'EX', ttlSeconds);
      }
      return client.set(key, value);
    }).pipe(
      Effect.mapError(
        (error) => new RedisError(error, `Failed to set key: ${key}`),
      ),
      Effect.asVoid,
    );

  const deleteKey = (key: string) =>
    Effect.tryPromise(() => client.del(key)).pipe(
      Effect.mapError(
        (error) => new RedisError(error, `Failed to delete key: ${key}`),
      ),
      Effect.asVoid,
    );

  const disconnect = () =>
    Effect.try({
      try: () => client.disconnect(),
      catch: (error) => new RedisError(error, 'Failed to disconnect Redis'),
    });

  return {
    get,
    set,
    delete: deleteKey,
    disconnect,
  } satisfies RedisService;
});

// Redis Layer
export const RedisLive = Layer.effect(RedisService, makeRedisService);

// Convenience functions for direct usage
export const get = (key: string) =>
  Effect.gen(function* () {
    const redis = yield* RedisService;
    return yield* redis.get(key);
  });

export const set = (key: string, value: string, ttlSeconds?: number) =>
  Effect.gen(function* () {
    const redis = yield* RedisService;
    return yield* redis.set(key, value, ttlSeconds);
  });

export const deleteKey = (key: string) =>
  Effect.gen(function* () {
    const redis = yield* RedisService;
    return yield* redis.delete(key);
  });
