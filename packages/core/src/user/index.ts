import { z } from '@hono/zod-openapi';
import { and, eq, isNull } from 'drizzle-orm';
import { Common } from '../common';
import { useTransaction } from '../drizzle/transaction';
import { Examples } from '../examples';
import { fn } from '../util/fn';
import { userTable } from './user.sql';

export namespace User {
  export const Info = z.object({
    id: z.string().openapi({
      description: Common.IdDescription,
      example: Examples.User.id,
    }),
    name: z.string().nullable().openapi({
      description: 'Name of the user.',
      example: Examples.User.name,
    }),
    email: z.string().openapi({
      description: 'Email address of the user.',
      example: Examples.User.email,
    }),
  });

  export const fromId = fn(Info.shape.id, async (id) =>
    useTransaction((tx) =>
      tx
        .select()
        .from(userTable)
        .where(and(eq(userTable.id, id), isNull(userTable.timeDeleted)))
        .then((rows) => rows.at(0)),
    ),
  );

  export const fromEmail = fn(Info.shape.email, async (email) =>
    useTransaction((tx) =>
      tx
        .select()
        .from(userTable)
        .where(and(eq(userTable.email, email), isNull(userTable.timeDeleted)))
        .then((rows) => rows.at(0)),
    ),
  );

  export const create = fn(Info.omit({ id: true }), async (info) =>
    useTransaction((tx) => {
      const id = crypto.randomUUID();
      return tx
        .insert(userTable)
        .values({ ...info, id })
        .returning();
    }),
  );
}
