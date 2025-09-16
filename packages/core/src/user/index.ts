import { eq } from 'drizzle-orm';
import { Context, Effect, Layer, Schema } from 'effect';
import { DatabaseError, DatabaseLive, DatabaseService } from '../drizzle/index';
import { type User, userTable } from './user.sql';

// Input schemas
export const CreateInput = Schema.Struct({
  email: Schema.String,
  name: Schema.String,
});

export const FromEmailInput = Schema.Struct({
  email: Schema.String,
});

// User Service
class UserService extends Context.Tag('UserService')<
  UserService,
  {
    readonly create: (
      input: unknown,
    ) => Effect.Effect<void, DatabaseError | Error>;
    readonly fromEmail: (
      input: unknown,
    ) => Effect.Effect<User[], DatabaseError | Error>;
  }
>() {}

// User Service Layer
export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const dbService = yield* DatabaseService;

    return {
      create: (input: unknown) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decodeUnknown(CreateInput)(input);
          return yield* dbService.transaction(async (tx) => {
            await tx.insert(userTable).values({
              id: crypto.randomUUID(),
              email: validated.email.toLowerCase(),
              name: validated.name,
            });
          });
        }),
      fromEmail: (input: unknown) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decodeUnknown(FromEmailInput)(input);
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

// Schemas are exported above
