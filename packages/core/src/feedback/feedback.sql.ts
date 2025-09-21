import { pgTable, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../drizzle/types';

export const feedbackTable = pgTable('feedback', {
  id: text('id').primaryKey(),
  topic: text('topic').notNull(),
  rating: text('rating').notNull(),
  feedback: text('feedback').notNull(),
  userId: text('user_id'),
  userEmail: text('user_email'),
  ...timestamps,
});

export type Feedback = typeof feedbackTable.$inferSelect;
