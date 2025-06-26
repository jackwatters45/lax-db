import { sql } from 'drizzle-orm';
import {
  bigint,
  timestamp as pgTimestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const id = {
  get id() {
    return uuid('id').primaryKey();
  },
};

export const timestamp = (name: string) =>
  pgTimestamp(name, {
    mode: 'date',
    precision: 3,
  });

export const dollar = (name: string) =>
  bigint(name, {
    mode: 'number',
  });

export const timestamps = {
  timeCreated: timestamp('time_created').notNull().defaultNow(),
  timeUpdated: timestamp('time_updated')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  timeDeleted: timestamp('time_deleted'),
};
