import { z } from '@hono/zod-openapi';
import { eq } from 'drizzle-orm';
import { db } from 'src/drizzle/index.js';
import { createTransaction } from '../drizzle/transaction.js';
import { Common } from '../util/common.js';
import { Examples } from '../util/examples.js';
import { fn } from '../util/fn.js';
import { userTable } from './user.sql.js';

export namespace User {
  export const Info = z
    .object({
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
    })
    // @ts-expect-error
    .openapi({
      ref: 'User',
      description: 'A Gaoalbound User',
      example: Examples.User,
    });

  export const create = fn(
    z.object({
      email: z.string().email(),
      name: z.string().optional(),
    }),
    async (input) =>
      await createTransaction(async (tx) => {
        const id = crypto.randomUUID();

        await tx.insert(userTable).values({
          id,
          email: input.email.toLowerCase(),
          name: input.name,
        });
      }),
  );

  export const fromEmail = fn(
    z.object({
      email: z.string().email(),
    }),
    async (input) => {
      const user = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, input.email));

      return user;
    },
  );
}
