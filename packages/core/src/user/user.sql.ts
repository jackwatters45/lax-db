import { boolean, pgTable, text } from 'drizzle-orm/pg-core';
import { id, timestamps } from '../drizzle/types';

export const userTable = pgTable('user', {
  ...id,
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  ...timestamps,
});
export type User = typeof userTable.$inferSelect;
