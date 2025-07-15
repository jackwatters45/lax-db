import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Resource } from 'sst';
import { Log } from '../util/log.js';

const pool = new Pool({
  host: Resource.Database.host,
  port: Resource.Database.port,
  user: Resource.Database.username,
  password: Resource.Database.password,
  database: Resource.Database.database,
});

const log = Log.create({ namespace: 'drizzle' });

const drizzleConfig =
  process.env.DRIZZLE_LOG === 'true'
    ? {
        logger: {
          logQuery(query: string, params: unknown[]) {
            log.info('query', { query });
            log.info('params', { params });
          },
        },
      }
    : {};

export const db = drizzle(pool, drizzleConfig);
