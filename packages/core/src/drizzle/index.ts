import * as PgDrizzle from '@effect/sql-drizzle/Pg';
import { PgClient } from '@effect/sql-pg';
import { Cause, Config, Console, Layer } from 'effect';
import { Resource } from 'sst';

// import ws from 'ws';
// import { neonConfig, Pool } from '@neondatabase/serverless';
// added Neon serverless driver since using aws lamdas
// neonConfig.webSocketConstructor = ws;
// This MUST be set for PlanetScale Postgres connections
// neonConfig.pipelineConnect = false;

const PgLive = PgClient.layerConfig({
  ssl: Config.succeed(true),
  host: Config.succeed(Resource.Database.host),
  port: Config.succeed(Resource.Database.port),
  username: Config.succeed(Resource.Database.username),
  password: Config.redacted(Config.succeed(Resource.Database.password)),
  database: Config.succeed(Resource.Database.database),
}).pipe(Layer.tapErrorCause((cause) => Console.log(Cause.pretty(cause))));

const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive));

export const DatabaseLive = Layer.mergeAll(PgLive, DrizzleLive);
