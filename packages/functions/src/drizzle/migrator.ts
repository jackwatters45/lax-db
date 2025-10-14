import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { Pool } from 'pg';
import { Resource } from 'sst';

const MainLayer = Layer.empty;

const MigratorRuntime = ManagedRuntime.make(MainLayer);

export const handler = async () => {
  MigratorRuntime.runPromise(
    Effect.acquireUseRelease(
      Effect.sync(
        () =>
          new Pool({
            ssl: true,
            host: Resource.Database.host,
            port: Resource.Database.port,
            user: Resource.Database.username,
            password: Resource.Database.password,
            database: Resource.Database.database,
          }),
      ),
      (client) =>
        Effect.gen(function* () {
          const db = drizzle(client);

          yield* Effect.promise(() =>
            migrate(db, {
              migrationsFolder: 'packages/core/migrations',
            }),
          );
        }),
      (client) => Effect.promise(() => client.end()),
    ),
  );
};
