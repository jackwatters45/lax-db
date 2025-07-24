import { pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core';

import { id, timestamps } from '../drizzle/types';

export const userTypeEnum = pgEnum('user_type', ['student', 'coach']);

export const userTable = pgTable('user', {
  ...id,
  ...timestamps,
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
});

export type User = typeof userTable.$inferSelect;
