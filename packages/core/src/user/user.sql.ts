import { boolean, index, pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../drizzle/types';

export const userTable = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified')
      .$defaultFn(() => false)
      .notNull(),
    image: text('image'),
    ...timestamps,
  },
  (table) => [index('user_email_idx').on(table.email)],
);
export type User = typeof userTable.$inferSelect;
