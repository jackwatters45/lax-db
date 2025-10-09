import { and, eq, inArray, isNull } from 'drizzle-orm';
import { Context, Effect, Layer, Runtime, Schema as S } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import { DatabaseError, DatabaseLive, DatabaseService } from '../drizzle';
import {
  type AddPlayerToTeamInput,
  AddPlayerToTeamInputSchema,
  type BulkDeletePlayersInput,
  BulkDeletePlayersInputSchema,
  type BulkRemovePlayersFromTeamInput,
  BulkRemovePlayersFromTeamInputSchema,
  type CreatePlayerInput,
  CreatePlayerInputSchema,
  type DeletePlayerInput,
  DeletePlayerInputSchema,
  type GetAllPlayersInput,
  GetAllPlayersInputSchema,
  type RemovePlayerFromTeamInput,
  RemovePlayerFromTeamInputSchema,
  type UpdatePlayerInput,
  UpdatePlayerInputSchema,
  type UpdateTeamPlayerInput,
  UpdateTeamPlayerInputSchema,
} from './player.schema';
import {
  type Player,
  playerTable,
  type TeamPlayer,
  teamPlayerTable,
} from './player.sql';

export * from './player.schema';

// Error classes
export class PlayerError extends Error {
  readonly _tag = 'PlayerError';
  constructor(
    readonly cause: unknown,
    message?: string,
  ) {
    super(message ?? 'Player operation failed');
  }
}

export class PlayerService extends Context.Tag('PlayerService')<
  PlayerService,
  {
    readonly getAll: (
      input: GetAllPlayersInput,
    ) => Effect.Effect<Player[], DatabaseError | ParseError>;
    readonly create: (
      input: CreatePlayerInput,
    ) => Effect.Effect<Player, ParseError | PlayerError | DatabaseError>;
    readonly updatePlayer: (
      input: UpdatePlayerInput,
    ) => Effect.Effect<Player, ParseError | PlayerError | DatabaseError>;
    readonly updateTeamPlayer: (
      input: UpdateTeamPlayerInput,
    ) => Effect.Effect<TeamPlayer, ParseError | PlayerError | DatabaseError>;
    readonly getTeamPlayers: (
      teamId: string,
    ) => Effect.Effect<(Player & TeamPlayer)[], DatabaseError>;
    readonly addPlayerToTeam: (
      input: AddPlayerToTeamInput,
    ) => Effect.Effect<TeamPlayer, ParseError | PlayerError | DatabaseError>;
    readonly removePlayerFromTeam: (
      input: RemovePlayerFromTeamInput,
    ) => Effect.Effect<void, DatabaseError | ParseError | PlayerError>;
    readonly bulkRemovePlayersFromTeam: (
      input: BulkRemovePlayersFromTeamInput,
    ) => Effect.Effect<void, DatabaseError | ParseError | PlayerError>;
    readonly deletePlayer: (
      input: DeletePlayerInput,
    ) => Effect.Effect<void, DatabaseError | ParseError>;
    readonly bulkDeletePlayers: (
      input: BulkDeletePlayersInput,
    ) => Effect.Effect<void, DatabaseError | ParseError>;
  }
>() {}

export const PlayerServiceLive = Layer.effect(
  PlayerService,
  Effect.gen(function* () {
    const dbService = yield* DatabaseService;

    return {
      getAll: (input: GetAllPlayersInput) =>
        Effect.gen(function* () {
          const validated = yield* S.decode(GetAllPlayersInputSchema)(input);

          const result = yield* Effect.tryPromise({
            try: () =>
              dbService.db
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
                ),
            catch: (error) =>
              new DatabaseError(error, 'Failed to get all players'),
          });

          return result;
        }),

      create: (input: CreatePlayerInput) =>
        Effect.gen(function* () {
          const validated = yield* S.decode(CreatePlayerInputSchema)(input);

          const result = yield* Effect.tryPromise({
            try: () =>
              dbService.db
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
                .then((rows) => rows.at(0)),
            catch: (error) =>
              new DatabaseError(error, 'Failed to create player'),
          });

          if (!result) {
            return yield* Effect.fail(
              new PlayerError('Insert failed', 'Failed to create player'),
            );
          }

          return result;
        }),

      getTeamPlayers: (teamId: string) =>
        Effect.tryPromise({
          try: () =>
            dbService.db
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
                  eq(teamPlayerTable.teamId, teamId),
                  isNull(playerTable.deletedAt),
                ),
              ),
          catch: (error) =>
            new DatabaseError(error, 'Failed to get team players'),
        }),

      updatePlayer: (input: UpdatePlayerInput) =>
        Effect.gen(function* () {
          const validated = yield* S.decode(UpdatePlayerInputSchema)(input);
          const { playerId, ...updateData } = validated;

          const result = yield* Effect.tryPromise({
            try: () =>
              dbService.db
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
                .then((rows) => rows.at(0)),
            catch: (error) =>
              new DatabaseError(error, 'Failed to update player'),
          });

          if (!result) {
            return yield* Effect.fail(
              new PlayerError('Update failed', 'Failed to update player'),
            );
          }

          return result;
        }),

      updateTeamPlayer: (input: UpdateTeamPlayerInput) =>
        Effect.gen(function* () {
          const validated = yield* S.decode(UpdateTeamPlayerInputSchema)(input);
          const { teamId, playerId, ...updateData } = validated;

          const player = yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .select({ id: playerTable.id })
                .from(playerTable)
                .where(
                  and(
                    eq(playerTable.publicId, playerId),
                    isNull(playerTable.deletedAt),
                  ),
                )
                .then((rows) => rows.at(0)),
            catch: (error) => new DatabaseError(error, 'Failed to find player'),
          });

          if (!player) {
            return yield* Effect.fail(
              new PlayerError('Not found', 'Player not found'),
            );
          }

          const result = yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .update(teamPlayerTable)
                .set(updateData)
                .where(
                  and(
                    eq(teamPlayerTable.teamId, teamId),
                    eq(teamPlayerTable.playerId, player.id),
                  ),
                )
                .returning()
                .then((rows) => rows.at(0)),
            catch: (error) =>
              new DatabaseError(error, 'Failed to update team player'),
          });

          if (!result) {
            return yield* Effect.fail(
              new PlayerError('Update failed', 'Failed to update team player'),
            );
          }

          return result;
        }),

      addPlayerToTeam: (input: AddPlayerToTeamInput) =>
        Effect.gen(function* () {
          const validated = yield* S.decode(AddPlayerToTeamInputSchema)(input);

          const player = yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .select({ id: playerTable.id })
                .from(playerTable)
                .where(
                  and(
                    eq(playerTable.publicId, validated.playerId),
                    isNull(playerTable.deletedAt),
                  ),
                )
                .then((rows) => rows.at(0)),
            catch: (error) => new DatabaseError(error, 'Failed to find player'),
          });

          if (!player) {
            return yield* Effect.fail(
              new PlayerError('Not found', 'Player not found'),
            );
          }

          const result = yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .insert(teamPlayerTable)
                .values({
                  teamId: validated.teamId,
                  playerId: player.id,
                  jerseyNumber: validated.jerseyNumber || null,
                  position: validated.position || null,
                })
                .returning(),
            catch: (error) =>
              new DatabaseError(error, 'Failed to add player to team'),
          });

          if (!result[0]) {
            return yield* Effect.fail(
              new PlayerError('Insert failed', 'Failed to add player to team'),
            );
          }

          return result[0];
        }),

      removePlayerFromTeam: (input: RemovePlayerFromTeamInput) =>
        Effect.gen(function* () {
          const validated = yield* S.decode(RemovePlayerFromTeamInputSchema)(
            input,
          );

          const player = yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .select({ id: playerTable.id })
                .from(playerTable)
                .where(
                  and(
                    eq(playerTable.publicId, validated.playerId),
                    isNull(playerTable.deletedAt),
                  ),
                )
                .then((rows) => rows.at(0)),
            catch: (error) => new DatabaseError(error, 'Failed to find player'),
          });

          if (!player) {
            return yield* Effect.fail(
              new PlayerError('Not found', 'Player not found'),
            );
          }

          yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .delete(teamPlayerTable)
                .where(
                  and(
                    eq(teamPlayerTable.teamId, validated.teamId),
                    eq(teamPlayerTable.playerId, player.id),
                  ),
                ),
            catch: (error) =>
              new DatabaseError(error, 'Failed to remove player from team'),
          });
        }),

      bulkRemovePlayersFromTeam: (input: BulkRemovePlayersFromTeamInput) =>
        Effect.gen(function* () {
          const validated = yield* S.decode(
            BulkRemovePlayersFromTeamInputSchema,
          )(input);

          const players = yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .select({ id: playerTable.id })
                .from(playerTable)
                .where(
                  and(
                    inArray(playerTable.publicId, validated.playerIds),
                    isNull(playerTable.deletedAt),
                  ),
                ),
            catch: (error) =>
              new DatabaseError(error, 'Failed to find players'),
          });

          const playerIds = players.map((p) => p.id);

          yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .delete(teamPlayerTable)
                .where(
                  and(
                    eq(teamPlayerTable.teamId, validated.teamId),
                    inArray(teamPlayerTable.playerId, playerIds),
                  ),
                ),
            catch: (error) =>
              new DatabaseError(
                error,
                'Failed to bulk remove players from team',
              ),
          });
        }),

      deletePlayer: (input: DeletePlayerInput) =>
        Effect.gen(function* () {
          const validated = yield* S.decode(DeletePlayerInputSchema)(input);
          yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .delete(playerTable)
                .where(eq(playerTable.publicId, validated.playerId)),
            catch: (error) =>
              new DatabaseError(error, 'Failed to delete player'),
          });
        }),

      bulkDeletePlayers: (input: BulkDeletePlayersInput) =>
        Effect.gen(function* () {
          const validated = yield* S.decode(BulkDeletePlayersInputSchema)(
            input,
          );
          yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .delete(playerTable)
                .where(inArray(playerTable.publicId, validated.playerIds)),
            catch: (error) =>
              new DatabaseError(error, 'Failed to bulk delete players'),
          });
        }),
    };
  }),
).pipe(Layer.provide(DatabaseLive));

// Runtime for executing player operations
const runtime = Runtime.defaultRuntime;

// Simple async API - no Effect boilerplate needed
export const PlayerAPI = {
  async getAll(input: GetAllPlayersInput): Promise<Player[]> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.getAll(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },

  async create(input: CreatePlayerInput): Promise<Player> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.create(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },

  async getTeamPlayers(teamId: string): Promise<(Player & TeamPlayer)[]> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.getTeamPlayers(teamId);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },

  async addPlayerToTeam(input: AddPlayerToTeamInput): Promise<TeamPlayer> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.addPlayerToTeam(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },

  async removePlayerFromTeam(input: RemovePlayerFromTeamInput): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.removePlayerFromTeam(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },

  async updatePlayer(input: UpdatePlayerInput): Promise<Player> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.updatePlayer(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },

  async updateTeamPlayer(input: UpdateTeamPlayerInput): Promise<TeamPlayer> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.updateTeamPlayer(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },

  async deletePlayer(input: DeletePlayerInput): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.deletePlayer(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },

  async bulkRemovePlayersFromTeam(
    input: BulkRemovePlayersFromTeamInput,
  ): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.bulkRemovePlayersFromTeam(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },

  async bulkDeletePlayers(input: BulkDeletePlayersInput): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.bulkDeletePlayers(input);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },
};

export type TeamPlayerWithInfo = Awaited<
  ReturnType<typeof PlayerAPI.getTeamPlayers>
>[number];
