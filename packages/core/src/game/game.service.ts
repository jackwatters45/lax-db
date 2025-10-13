import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../drizzle';
import { decodeArguments } from '../util';
import { ErrorInvalidGame } from './game.error';
import {
  CreateGameInput,
  DeleteGameInput,
  GetAllGamesInput,
  GetGameInput,
  UpdateGameInput,
} from './game.schema';
import { type GameSelect, gameTable } from './game.sql';

export class GameService extends Effect.Service<GameService>()('GameService', {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const { id: _, ...rest } = getTableColumns(gameTable);

    return {
      getAll: (input: GetAllGamesInput) =>
        Effect.gen(function* () {
          const _decoded = yield* decodeArguments(GetAllGamesInput, input);

          return yield* db
            .select(rest)
            .from(gameTable)
            .where(isNull(gameTable.deletedAt))
            .pipe(
              Effect.tapError(Effect.logError),
              Effect.mapError((cause) => new ErrorInvalidGame({ cause })),
              // TODO: better error
              // TODO: add cron job to delete deleted players etc after a certain time
            );
        }),

      get: (input: GetGameInput) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(GetGameInput, input);

          const game: GameSelect = yield* db
            .select(rest)
            .from(gameTable)
            .where(
              and(
                eq(gameTable.publicId, decoded.publicId),
                isNull(gameTable.deletedAt),
              ),
            )
            .pipe(
              Effect.flatMap(Arr.head),
              Effect.tapError(Effect.logError),
              Effect.mapError((cause) => new ErrorInvalidGame({ cause })),
            );

          return game;
        }),

      create: (input: CreateGameInput) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(CreateGameInput, input);

          // TODO: ensure season exists
          // @ts-expect-error
          yield* db.insert(gameTable).values(decoded);
        }),

      update: (input: UpdateGameInput) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(UpdateGameInput, input);

          yield* db
            .update(gameTable)
            // TODO: what to update
            .set({})
            .where(
              and(
                eq(gameTable.publicId, decoded.publicId),
                eq(gameTable.organizationId, decoded.organizationId),
                // TODO: add nullish team id to this...
                // ...{ decoded.teamId && { ...eq(gameTable.teamId, decoded.teamId) } },
                isNull(gameTable.deletedAt),
              ),
            )
            .pipe(
              Effect.tapError(Effect.logError),
              Effect.mapError((cause) => new ErrorInvalidGame({ cause })),
            );
        }),

      delete: (input: DeleteGameInput) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(DeleteGameInput, input);

          yield* db
            .delete(gameTable)
            .where(
              and(
                eq(gameTable.publicId, decoded.publicId),
                eq(gameTable.organizationId, decoded.organizationId),
                // TODO: add nullish team id to this...
                // ...{ decoded.teamId && { ...eq(gameTable.teamId, decoded.teamId) } },
                isNull(gameTable.deletedAt),
              ),
            )
            .pipe(
              Effect.tapError(Effect.logError),
              Effect.mapError((cause) => new ErrorInvalidGame({ cause })),
            );
        }),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
