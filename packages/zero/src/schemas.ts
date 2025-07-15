import { createSchema, number, string, table } from '@rocicorp/zero';

const timestamps = {
  time_created: number(),
  time_deleted: number().optional(),
  time_updated: number().optional(),
} as const;

const user = table('user')
  .columns({
    id: string(),
    workspace_id: string(),
    email: string(),
    ...timestamps,
  })
  .primaryKey('workspace_id', 'id');

export const schema = createSchema({
  tables: [user],
});

export type Schema = typeof schema;
