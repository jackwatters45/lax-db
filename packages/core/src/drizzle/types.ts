import { timestamp as pgTimestamp, uuid } from 'drizzle-orm/pg-core';

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

export const timestamps = {
  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$onUpdate(
    () => /* @__PURE__ */ new Date(),
  ),
  deletedAt: timestamp('updated_at'),
};
