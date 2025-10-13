import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { Array as Arr, Effect, Schema } from 'effect';
import { DatabaseLive } from '../drizzle';
import { PlayerError } from './player.error';
import {
  AddPlayerToTeamInput,
  BulkDeletePlayersInput,
  BulkRemovePlayersFromTeamInput,
  CreatePlayerInput,
  DeletePlayerInput,
  GetAllPlayersInput,
  GetTeamPlayersInput,
  RemovePlayerFromTeamInput,
  UpdatePlayerInput,
  UpdateTeamPlayerInput,
} from './player.schema';
import { playerTable, teamPlayerTable } from './player.sql';

export class PlayerService extends Effect.Service<PlayerService>()(
  'PlayerService',
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      return {
        getAll: (input: GetAllPlayersInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(GetAllPlayersInput)(input);

            const result = yield* db
              .select({
                publicId: playerTable.publicId,
                organizationId: playerTable.organizationId,
                userId: playerTable.userId,
                name: playerTable.name,
                email: playerTable.email,
                phone: playerTable.phone,
                dateOfBirth: playerTable.dateOfBirth,
                createdAt: playerTable.createdAt,
                updatedAt: playerTable.updatedAt,
                deletedAt: playerTable.deletedAt,
              })
              .from(playerTable)
              .where(
                and(
                  eq(playerTable.organizationId, validated.organizationId),
                  isNull(playerTable.deletedAt),
                ),
              )
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );

            return result;
          }),

        create: (input: CreatePlayerInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(CreatePlayerInput)(input);

            const result = yield* db
              .insert(playerTable)
              .values({
                organizationId: validated.organizationId,
                userId: validated.userId || null,
                name: validated.name,
                email: validated.email || null,
                phone: validated.phone || null,
                dateOfBirth: validated.dateOfBirth || null,
              })
              .returning({
                publicId: playerTable.publicId,
                organizationId: playerTable.organizationId,
                userId: playerTable.userId,
                name: playerTable.name,
                email: playerTable.email,
                phone: playerTable.phone,
                dateOfBirth: playerTable.dateOfBirth,
                createdAt: playerTable.createdAt,
                updatedAt: playerTable.updatedAt,
                deletedAt: playerTable.deletedAt,
              })
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );

            if (!result) {
              return yield* Effect.fail(
                new PlayerError({ customMessage: 'Failed to create player' }),
              );
            }

            return result;
          }),

        getTeamPlayers: (input: GetTeamPlayersInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(GetTeamPlayersInput)(input);

            return yield* db
              .select({
                publicId: playerTable.publicId,
                organizationId: playerTable.organizationId,
                userId: playerTable.userId,
                name: playerTable.name,
                email: playerTable.email,
                phone: playerTable.phone,
                dateOfBirth: playerTable.dateOfBirth,
                createdAt: playerTable.createdAt,
                updatedAt: playerTable.updatedAt,
                deletedAt: playerTable.deletedAt,
                teamId: teamPlayerTable.teamId,
                jerseyNumber: teamPlayerTable.jerseyNumber,
                position: teamPlayerTable.position,
              })
              .from(playerTable)
              .innerJoin(
                teamPlayerTable,
                eq(playerTable.id, teamPlayerTable.playerId),
              )
              .where(
                and(
                  eq(teamPlayerTable.teamId, validated.teamId),
                  isNull(playerTable.deletedAt),
                ),
              )
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );
          }),

        updatePlayer: (input: UpdatePlayerInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(UpdatePlayerInput)(input);
            const { playerId, ...updateData } = validated;

            const result = yield* db
              .update(playerTable)
              .set(updateData)
              .where(
                and(
                  eq(playerTable.publicId, playerId),
                  isNull(playerTable.deletedAt),
                ),
              )
              .returning({
                publicId: playerTable.publicId,
                organizationId: playerTable.organizationId,
                userId: playerTable.userId,
                name: playerTable.name,
                email: playerTable.email,
                phone: playerTable.phone,
                dateOfBirth: playerTable.dateOfBirth,
                createdAt: playerTable.createdAt,
                updatedAt: playerTable.updatedAt,
                deletedAt: playerTable.deletedAt,
              })
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );

            if (!result) {
              return yield* Effect.fail(
                new PlayerError({ customMessage: 'Failed to update player' }),
              );
            }

            return result;
          }),

        updateTeamPlayer: (input: UpdateTeamPlayerInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(UpdateTeamPlayerInput)(
              input,
            );
            const { teamId, playerId, ...updateData } = validated;

            const player = yield* db
              .select({ id: playerTable.id })
              .from(playerTable)
              .where(
                and(
                  eq(playerTable.publicId, playerId),
                  isNull(playerTable.deletedAt),
                ),
              )
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );

            if (!player) {
              return yield* Effect.fail(
                new PlayerError({ customMessage: 'Player not found' }),
              );
            }

            const result = yield* db
              .update(teamPlayerTable)
              .set(updateData)
              .where(
                and(
                  eq(teamPlayerTable.teamId, teamId),
                  eq(teamPlayerTable.playerId, player.id),
                ),
              )
              .returning()
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );

            if (!result) {
              return yield* Effect.fail(
                new PlayerError({
                  customMessage: 'Failed to update team player',
                }),
              );
            }

            return result;
          }),

        addPlayerToTeam: (input: AddPlayerToTeamInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(AddPlayerToTeamInput)(input);

            const player = yield* db
              .select({ id: playerTable.id })
              .from(playerTable)
              .where(
                and(
                  eq(playerTable.publicId, validated.playerId),
                  isNull(playerTable.deletedAt),
                ),
              )
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );

            if (!player) {
              return yield* Effect.fail(
                new PlayerError({ customMessage: 'Player not found' }),
              );
            }

            const result = yield* db
              .insert(teamPlayerTable)
              .values({
                teamId: validated.teamId,
                playerId: player.id,
                jerseyNumber: validated.jerseyNumber || null,
                position: validated.position || null,
              })
              .returning()
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );

            if (!result) {
              return yield* Effect.fail(
                new PlayerError({
                  customMessage: 'Failed to add player to team',
                }),
              );
            }

            return result;
          }),

        removePlayerFromTeam: (input: RemovePlayerFromTeamInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(RemovePlayerFromTeamInput)(
              input,
            );

            const player = yield* db
              .select({ id: playerTable.id })
              .from(playerTable)
              .where(
                and(
                  eq(playerTable.publicId, validated.playerId),
                  isNull(playerTable.deletedAt),
                ),
              )
              .pipe(
                Effect.flatMap(Arr.head),
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );

            if (!player) {
              return yield* Effect.fail(
                new PlayerError({ customMessage: 'Player not found' }),
              );
            }

            yield* db
              .delete(teamPlayerTable)
              .where(
                and(
                  eq(teamPlayerTable.teamId, validated.teamId),
                  eq(teamPlayerTable.playerId, player.id),
                ),
              )
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );
          }),

        bulkRemovePlayersFromTeam: (input: BulkRemovePlayersFromTeamInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(
              BulkRemovePlayersFromTeamInput,
            )(input);

            const players = yield* db
              .select({ id: playerTable.id })
              .from(playerTable)
              .where(
                and(
                  inArray(playerTable.publicId, validated.playerIds),
                  isNull(playerTable.deletedAt),
                ),
              )
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );

            const playerIds = players.map((p) => p.id);

            yield* db
              .delete(teamPlayerTable)
              .where(
                and(
                  eq(teamPlayerTable.teamId, validated.teamId),
                  inArray(teamPlayerTable.playerId, playerIds),
                ),
              )
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );
          }),

        deletePlayer: (input: DeletePlayerInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(DeletePlayerInput)(input);
            yield* db
              .delete(playerTable)
              .where(eq(playerTable.publicId, validated.playerId))
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );
          }),

        bulkDeletePlayers: (input: BulkDeletePlayersInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(BulkDeletePlayersInput)(
              input,
            );
            yield* db
              .delete(playerTable)
              .where(inArray(playerTable.publicId, validated.playerIds))
              .pipe(
                Effect.tapError(Effect.logError),
                Effect.mapError(() => new PlayerError()),
              );
          }),
      } as const;
    }),
    dependencies: [DatabaseLive],
  },
) {}
