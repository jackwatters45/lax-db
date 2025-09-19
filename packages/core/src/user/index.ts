import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { Context, Effect, Layer, Schema } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import { DatabaseError, DatabaseLive, DatabaseService } from '../drizzle/index';
import { type User, userTable } from './user.sql';

// Input schemas
export const CreateInput = Schema.Struct({
  email: Schema.String,
  name: Schema.String,
});
type CreateInput = typeof CreateInput.Type;

export const FromEmailInput = Schema.Struct({
  email: Schema.String,
});
type FromEmailInput = typeof FromEmailInput.Type;

// User Service
class UserService extends Context.Tag('UserService')<
  UserService,
  {
    readonly create: (
      input: CreateInput,
    ) => Effect.Effect<void, DatabaseError | ParseError>;
    readonly fromEmail: (
      input: FromEmailInput,
    ) => Effect.Effect<User[], DatabaseError | ParseError>;
  }
>() {}

// User Service Layer
export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const dbService = yield* DatabaseService;

    return {
      create: (input) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(CreateInput)(input);
          return yield* dbService.transaction(async (tx) => {
            await tx.insert(userTable).values({
              id: randomUUID(),
              email: validated.email.toLowerCase(),
              name: validated.name,
            });
          });
        }),
      fromEmail: (input) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(FromEmailInput)(input);
          return yield* Effect.tryPromise(() =>
            dbService.db
              .select()
              .from(userTable)
              .where(eq(userTable.email, validated.email)),
          ).pipe(Effect.mapError((cause) => new DatabaseError(cause)));
        }),
    };
  }),
).pipe(Layer.provide(DatabaseLive));
