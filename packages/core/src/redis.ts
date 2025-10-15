import { Data, Effect } from 'effect';
import { Redis, type RedisOptions } from 'ioredis';
import { Resource } from 'sst';

export class RedisError extends Data.TaggedError('RedisError')<{
  cause: unknown;
  msg: string;
}> {}

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
        redisConfig.tls = {};
      }

      // Create Redis client
      const client = new Redis(redisConfig);

      return {
        get: Effect.fn('Redis:get')(function* (key: string) {
          return yield* Effect.tryPromise(() => client.get(key)).pipe(
            Effect.tapError(Effect.logError),
            Effect.mapError(
              (cause) =>
                new RedisError({ msg: `Failed to get key: ${key}`, cause })
            )
          );
        }),

        set: Effect.fn('Redis:set')(function* (
          key: string,
          value: string,
          ttlSeconds?: number
        ) {
          return yield* Effect.tryPromise(() => {
            if (ttlSeconds) {
              return client.set(key, value, 'EX', ttlSeconds);
            }
            return client.set(key, value);
          }).pipe(
            Effect.mapError(
              (cause) =>
                new RedisError({ msg: `Failed to set key: ${key}`, cause })
            ),
            Effect.asVoid
          );
        }),

        delete: Effect.fn('Redis:delete')(function* (key: string) {
          return yield* Effect.tryPromise(() => client.del(key)).pipe(
            Effect.mapError(
              (cause) =>
                new RedisError({
                  msg: `Failed to delete key: ${key}`,
                  cause,
                })
            ),
            Effect.asVoid
          );
        }),

        disconnect: Effect.fn('Redis:disconnect')(function* () {
          return yield* Effect.try({
            try: () => client.disconnect(),
            catch: (cause) =>
              new RedisError({ msg: 'Failed to disconnect Redis', cause }),
          });
        }),
      };
    }),
  }
) {}
