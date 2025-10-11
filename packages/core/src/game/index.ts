import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../drizzle';
import { decodeArguments } from '../error';
import { ErrorInvalidGame } from './game.error';
import { GetAllGamesInputSchema, GetGameInputSchema } from './game.schema';
import { type Game, gameTable } from './game.sql';

export class GameService extends Effect.Service<GameService>()('GameService', {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const { id: _, ...rest } = getTableColumns(gameTable);

    return {
      getAll: (input: GetAllGamesInputSchema) =>
        Effect.gen(function* () {
          const _decoded = yield* decodeArguments(
            GetAllGamesInputSchema,
            input,
          );

          return yield* db
            .select(rest)
            .from(gameTable)
            .where(isNull(gameTable.deletedAt))
            .pipe(
              Effect.tapError((err) => Effect.logError(err)),
              Effect.mapError(() => new ErrorInvalidGame()),
              // TODO: better error
              // TODO: add cron job to delete deleted players etc after a certain time
            );
        }),

      get: (input: GetGameInputSchema) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(GetGameInputSchema, input);

          const game: Game = yield* db
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
              Effect.tapError((err) => Effect.logError(err)),
              Effect.mapError(() => new ErrorInvalidGame()),
            );

          return game;
        }),

      create: () => Effect.gen(function* () {}),

      update: () => Effect.gen(function* () {}),

      delete: () => Effect.gen(function* () {}),
    };
  }),
  dependencies: [DatabaseLive],
}) {}
