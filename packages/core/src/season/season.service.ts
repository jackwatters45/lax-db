import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../drizzle';
import { decodeArguments } from '../util';
import { ErrorInvalidSeason } from './season.error';
import {
  CreateSeasonInput,
  DeleteSeasonInput,
  GetAllSeasonsInput,
  GetSeasonInput,
  UpdateSeasonInput,
} from './season.schema';
import { type SeasonSelect, seasonTable } from './season.sql';

export class SeasonService extends Effect.Service<SeasonService>()(
  'SeasonService',
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      const { id: _, ...rest } = getTableColumns(seasonTable);

      return {
        getAll: (input: GetAllSeasonsInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetAllSeasonsInput, input);

            const seasons: Array<SeasonSelect> = yield* db
              .select(rest)
              .from(seasonTable)
              .where(
                and(
                  eq(seasonTable.organizationId, decoded.organizationId),
                  // TODO: add nullish team id to this...
                  // ...{ decoded.teamId && { ...eq(seasonTable.teamId, decoded.teamId) } },
                  isNull(seasonTable.deletedAt),
                ),
              )
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new ErrorInvalidSeason()),
              );

            return seasons;
          }),

        get: (input: GetSeasonInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetSeasonInput, input);

            const season: SeasonSelect = yield* db
              .select(rest)
              .from(seasonTable)
              .where(
                and(
                  eq(seasonTable.publicId, decoded.publicId),
                  eq(seasonTable.organizationId, decoded.organizationId),
                  // TODO: add nullish team id to this...
                  // ...{ decoded.teamId && { ...eq(seasonTable.teamId, decoded.teamId) } },
                  isNull(seasonTable.deletedAt),
                ),
              )
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new ErrorInvalidSeason()),
              );

            return season;
          }),

        create: (input: CreateSeasonInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreateSeasonInput, input);

            yield* db.insert(seasonTable).values(decoded);
          }),

        update: (input: UpdateSeasonInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdateSeasonInput, input);

            yield* db
              .update(seasonTable)
              // TODO: what to update
              .set({})
              .where(
                and(
                  eq(seasonTable.publicId, decoded.publicId),
                  eq(seasonTable.organizationId, decoded.organizationId),
                  // TODO: add nullish team id to this...
                  // ...{ decoded.teamId && { ...eq(seasonTable.teamId, decoded.teamId) } },
                  isNull(seasonTable.deletedAt),
                ),
              )
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new ErrorInvalidSeason()),
              );
          }),

        delete: (input: DeleteSeasonInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(DeleteSeasonInput, input);

            yield* db
              .delete(seasonTable)
              .where(
                and(
                  eq(seasonTable.publicId, decoded.publicId),
                  eq(seasonTable.organizationId, decoded.organizationId),
                  // TODO: add nullish team id to this...
                  // ...{ decoded.teamId && { ...eq(seasonTable.teamId, decoded.teamId) } },
                  isNull(seasonTable.deletedAt),
                ),
              )
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new ErrorInvalidSeason()),
              );
          }),
      } as const;
    }),
    dependencies: [DatabaseLive],
  },
) {}
