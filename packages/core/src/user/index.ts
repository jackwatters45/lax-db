import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../drizzle/index.js';
import { createTransaction } from '../drizzle/transaction.js';
import { fn } from '../util/fn.js';
import { userTable } from './user.sql.js';

export namespace User {
  export const Info = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
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
