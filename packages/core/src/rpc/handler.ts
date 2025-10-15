import type { Rpc } from '@effect/rpc';
import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { getTableColumns, isNull } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { DatabaseLive } from '../drizzle/drizzle.service';
import type { Games } from '../game/game.schema';
import { gameTable } from '../game/game.sql';
import { GameRpcs, SchemaErrorInvalidGame } from './request';

export class GameRepository extends Effect.Service<GameRepository>()(
  'GameRepository',
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      const { id: _, ...rest } = getTableColumns(gameTable);

      return {
        getAll: () =>
          Effect.gen(function* () {
            const games = yield* db
              .select(rest)
              .from(gameTable)
              .where(isNull(gameTable.deletedAt))
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(
                  (cause) => new SchemaErrorInvalidGame({ cause })
                )
                // TODO: better error
                // TODO: add cron job to delete deleted players etc after a certain time
              );

            return games as unknown as typeof Games.Type;
          }),
      } as const;
    }),
    dependencies: [DatabaseLive],
  }
) {}

// ---------------------------------------------
// RPC handlers
// ---------------------------------------------

export const GameLive: Layer.Layer<Rpc.Handler<'GameList'>> = GameRpcs.toLayer(
  Effect.gen(function* () {
    const game = yield* GameRepository;

    return {
      GameList: () => game.getAll(),
    };
  })
).pipe(Layer.provide(GameRepository.Default));
