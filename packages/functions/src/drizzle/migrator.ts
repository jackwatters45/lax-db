import { db } from '@lax-db/core/drizzle/index';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

export const handler = async () => {
  await migrate(db, {
    migrationsFolder: 'packages/core/migrations',
  });
};
