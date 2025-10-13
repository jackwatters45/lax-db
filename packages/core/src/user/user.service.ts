import { randomUUID } from 'node:crypto';
import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { eq } from 'drizzle-orm';
import { Effect, Schema } from 'effect';
import { DatabaseLive } from '../drizzle';
import { UserError } from './user.error';
import { CreateInput, FromEmailInput } from './user.schema';
import { userTable } from './user.sql';

export class UserService extends Effect.Service<UserService>()('UserService', {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    return {
      create: (input: CreateInput) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(CreateInput)(input);
          return yield* db.insert(userTable).values({
            id: randomUUID(),
            email: validated.email.toLowerCase(),
            name: validated.name,
          });
        }),
      fromEmail: (input: FromEmailInput) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(FromEmailInput)(input);
          return yield* db
            .select()
            .from(userTable)
            .where(eq(userTable.email, validated.email))
            .pipe(
              Effect.tapError(Effect.logError),
              Effect.mapError((cause) => new UserError({ cause })),
            );
        }),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
