import { RedisClient } from 'bun';
import { Effect, Schema } from 'effect';
import { Resource } from 'sst';

export class RedisError extends Schema.TaggedError<RedisError>()(
  'RedisError',
  {},
) {}

export class RedisService extends Effect.Service<RedisService>()(
  'RedisService',
  {
    effect: Effect.gen(function* () {
      const redisConfig: Bun.RedisOptions = {
        tls: Resource.Redis.host !== 'localhost',
      };

      const client = new RedisClient(
        `redis://${Resource.Redis.username}:${Resource.Redis.password}@${Resource.Redis.host}:${Resource.Redis.port}`,
        redisConfig,
      );

      return {
        get: (key: string) =>
          Effect.gen(function* () {
            return yield* Effect.tryPromise(() => client.get(key)).pipe(
              Effect.tapError((err) => Effect.logError(err)),
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
              try: () => client.close(),
              catch: () => new RedisError('Failed to disconnect Redis'),
            });
          }),
      };
    }),
  },
) {}
