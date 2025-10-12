import { Effect, Schema } from 'effect';
import { Redis, type RedisOptions } from 'ioredis';
import { Resource } from 'sst';

export class RedisError extends Schema.TaggedError<RedisError>()(
  'RedisError',
  {},
) {}

export class RedisService extends Effect.Service<RedisService>()(
  'RedisService',
  {
    effect: Effect.gen(function* () {
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

      return {
        get: (key: string) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise(() => client.get(key)).pipe(
              Effect.tapError(Effect.logError),
              Effect.mapError(
                () => new RedisError(`Failed to get key: ${key}`),
              ),
            );
          }),

        set: (key: string, value: string, ttlSeconds?: number) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise(() => {
              if (ttlSeconds) {
                return client.set(key, value, 'EX', ttlSeconds);
              }
              return client.set(key, value);
            }).pipe(
              Effect.mapError(
                () => new RedisError(`Failed to set key: ${key}`),
              ),
              Effect.asVoid,
            );
          }),

        delete: (key: string) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise(() => client.del(key)).pipe(
              Effect.mapError(
                () => new RedisError(`Failed to delete key: ${key}`),
              ),
              Effect.asVoid,
            );
          }),

        disconnect: () =>
          Effect.gen(function* () {
            return yield* Effect.try({
              try: () => client.disconnect(),
              catch: () => new RedisError('Failed to disconnect Redis'),
            });
          }),
      };
    }),
  },
) {}
