import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../drizzle';
import { decodeArguments } from '../error';
import { ErrorInvalidSeason } from './season.error';
import { GetSeasonInputSchema } from './season.schema';
import { type Season, seasonTable } from './season.sql';

export class SeasonService extends Effect.Service<SeasonService>()(
  'SeasonService',
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      const { id: _, ...rest } = getTableColumns(seasonTable);

      return {
        getAll: () => Effect.gen(function* () {}),

        get: (input: GetSeasonInputSchema) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetSeasonInputSchema, input);

            const season: Season = yield* db
              .select(rest)
              .from(seasonTable)
              .where(
                and(
                  eq(seasonTable.publicId, decoded.publicId),
                  isNull(seasonTable.deletedAt),
                ),
              )
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError((err) => Effect.logError(err)),
                Effect.mapError(() => new ErrorInvalidSeason()),
              );

            return season;
          }),

        create: () => Effect.gen(function* () {}),

        update: () => Effect.gen(function* () {}),

        delete: () => Effect.gen(function* () {}),
      };
    }),
    dependencies: [DatabaseLive],
  },
) {}
