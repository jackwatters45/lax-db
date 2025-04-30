import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Resource } from 'sst';
import { Log } from '../util/log';

const pool = new Pool({
  host: Resource.Database.host,
  port: Resource.Database.port,
  user: Resource.Database.username,
  password: Resource.Database.password,
  database: Resource.Database.database,
});

const log = Log.create({ namespace: 'drizzle' });

export const db = drizzle(pool, {
  logger:
    process.env.DRIZZLE_LOG === 'true'
      ? {
          logQuery(query, params) {
            log.info('query', { query });
            log.info('params', { params });
          },
        }
      : undefined,
});
