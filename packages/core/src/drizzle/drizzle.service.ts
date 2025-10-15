import * as PgDrizzle from '@effect/sql-drizzle/Pg';
import { PgClient } from '@effect/sql-pg';
import { Cause, Config, Console, Layer } from 'effect';
import { Resource } from 'sst';

const PgLive = PgClient.layerConfig({
  ssl: Config.succeed(true),
  host: Config.succeed(Resource.Database.host),
  port: Config.succeed(Resource.Database.port),
  username: Config.succeed(Resource.Database.username),
  password: Config.redacted(Config.succeed(Resource.Database.password)),
  database: Config.succeed(Resource.Database.database),
}).pipe(
  Layer.tapErrorCause((cause) => Console.log(Cause.pretty(cause))),
  Layer.orDie,
);

const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive));

export const DatabaseLive = Layer.mergeAll(PgLive, DrizzleLive);
