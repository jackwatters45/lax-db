import { and, eq, ilike } from 'drizzle-orm';
import { Context, Effect, Layer, Runtime, Schema } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import { DatabaseError, DatabaseLive, DatabaseService } from '../drizzle';
import {
  type Player,
  playerTable,
  type TeamPlayer,
  teamPlayerTable,
} from './player.sql';

// Input schemas
export const CreatePlayerInput = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Name is required' }),
  ),
  email: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String),
  dateOfBirth: Schema.optional(Schema.String),
  userId: Schema.optional(Schema.String),
});
type CreatePlayerInput = typeof CreatePlayerInput.Type;

export const AddPlayerToTeamInput = Schema.Struct({
  playerId: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Player ID is required' }),
  ),
  teamId: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Team ID is required' }),
  ),
  jerseyNumber: Schema.optional(
    Schema.Number.pipe(
      Schema.int({ message: () => 'Jersey number must be an integer' }),
      Schema.positive({ message: () => 'Jersey number must be positive' }),
    ),
  ),
  position: Schema.optional(Schema.String),
});
type AddPlayerToTeamInput = typeof AddPlayerToTeamInput.Type;

export const UpdatePlayerInput = Schema.Struct({
  playerId: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Player ID is required' }),
  ),
  name: Schema.optional(Schema.String),
  email: Schema.optional(Schema.NullOr(Schema.String)),
  phone: Schema.optional(Schema.NullOr(Schema.String)),
  dateOfBirth: Schema.optional(Schema.NullOr(Schema.String)),
});
type UpdatePlayerInput = typeof UpdatePlayerInput.Type;

export const UpdateTeamPlayerInput = Schema.Struct({
  teamId: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Team ID is required' }),
  ),
  playerId: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Player ID is required' }),
  ),
  jerseyNumber: Schema.optional(
    Schema.NullOr(
      Schema.Number.pipe(
        Schema.int({ message: () => 'Jersey number must be an integer' }),
        Schema.positive({ message: () => 'Jersey number must be positive' }),
      ),
    ),
  ),
  position: Schema.optional(Schema.NullOr(Schema.String)),
});
type UpdateTeamPlayerInput = typeof UpdateTeamPlayerInput.Type;

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
    readonly getAll: () => Effect.Effect<Player[], DatabaseError>;
    readonly search: (query: string) => Effect.Effect<Player[], DatabaseError>;
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
      teamId: string,
      playerId: string,
    ) => Effect.Effect<void, DatabaseError>;
    readonly deletePlayer: (
      playerId: string,
    ) => Effect.Effect<void, DatabaseError>;
  }
>() {}

export const PlayerServiceLive = Layer.effect(
  PlayerService,
  Effect.gen(function* () {
    const dbService = yield* DatabaseService;

    return {
      getAll: () =>
        Effect.tryPromise({
          try: () => dbService.db.select().from(playerTable),
          catch: (error) =>
            new DatabaseError(error, 'Failed to get all players'),
        }),

      search: (query: string) =>
        Effect.tryPromise({
          try: () =>
            dbService.db
              .select()
              .from(playerTable)
              .where(ilike(playerTable.name, `%${query}%`)),
          catch: (error) =>
            new DatabaseError(error, 'Failed to search players'),
        }),

      create: (input: CreatePlayerInput) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(CreatePlayerInput)(input);

          const id = crypto.randomUUID();

          const result = yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .insert(playerTable)
                .values({
                  id,
                  userId: validated.userId || null,
                  name: validated.name,
                  email: validated.email || null,
                  phone: validated.phone || null,
                  dateOfBirth: validated.dateOfBirth || null,
                })
                .returning(),
            catch: (error) =>
              new DatabaseError(error, 'Failed to create player'),
          });

          if (!result[0]) {
            return yield* Effect.fail(
              new PlayerError('Insert failed', 'Failed to create player'),
            );
          }

          return result[0];
        }),

      getTeamPlayers: (teamId: string) =>
        Effect.tryPromise({
          try: () =>
            dbService.db
              .select({
                // Player fields
                id: playerTable.id,
                userId: playerTable.userId,
                name: playerTable.name,
                email: playerTable.email,
                phone: playerTable.phone,
                dateOfBirth: playerTable.dateOfBirth,
                createdAt: playerTable.createdAt,
                updatedAt: playerTable.updatedAt,
                deletedAt: playerTable.deletedAt,
                // TeamPlayer fields
                teamId: teamPlayerTable.teamId,
                playerId: teamPlayerTable.playerId,
                jerseyNumber: teamPlayerTable.jerseyNumber,
                position: teamPlayerTable.position,
              })
              .from(playerTable)
              .innerJoin(
                teamPlayerTable,
                eq(playerTable.id, teamPlayerTable.playerId),
              )
              .where(eq(teamPlayerTable.teamId, teamId)),
          catch: (error) =>
            new DatabaseError(error, 'Failed to get team players'),
        }),

      updatePlayer: (input: UpdatePlayerInput) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(UpdatePlayerInput)(input);
          const { playerId, ...updateData } = validated;

          const result = yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .update(playerTable)
                .set(updateData)
                .where(eq(playerTable.id, playerId))
                .returning(),
            catch: (error) =>
              new DatabaseError(error, 'Failed to update player'),
          });

          if (!result[0]) {
            return yield* Effect.fail(
              new PlayerError('Update failed', 'Failed to update player'),
            );
          }

          return result[0];
        }),

      updateTeamPlayer: (input: UpdateTeamPlayerInput) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(UpdateTeamPlayerInput)(input);
          const { teamId, playerId, ...updateData } = validated;

          const result = yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .update(teamPlayerTable)
                .set(updateData)
                .where(
                  and(
                    eq(teamPlayerTable.teamId, teamId),
                    eq(teamPlayerTable.playerId, playerId),
                  ),
                )
                .returning(),
            catch: (error) =>
              new DatabaseError(error, 'Failed to update team player'),
          });

          if (!result[0]) {
            return yield* Effect.fail(
              new PlayerError('Update failed', 'Failed to update team player'),
            );
          }

          return result[0];
        }),

      addPlayerToTeam: (input: AddPlayerToTeamInput) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(AddPlayerToTeamInput)(input);
          const id = crypto.randomUUID();

          const result = yield* Effect.tryPromise({
            try: () =>
              dbService.db
                .insert(teamPlayerTable)
                .values({
                  id,
                  teamId: validated.teamId,
                  playerId: validated.playerId,
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

      removePlayerFromTeam: (teamId: string, playerId: string) =>
        Effect.tryPromise({
          try: () =>
            dbService.db
              .delete(teamPlayerTable)
              .where(
                and(
                  eq(teamPlayerTable.teamId, teamId),
                  eq(teamPlayerTable.playerId, playerId),
                ),
              ),
          catch: (error) =>
            new DatabaseError(error, 'Failed to remove player from team'),
        }).pipe(Effect.map(() => {})),

      deletePlayer: (playerId: string) =>
        Effect.tryPromise({
          try: () =>
            dbService.db
              .delete(playerTable)
              .where(eq(playerTable.id, playerId)),
          catch: (error) => new DatabaseError(error, 'Failed to delete player'),
        }).pipe(Effect.map(() => {})),
    };
  }),
).pipe(Layer.provide(DatabaseLive));

// Runtime for executing player operations
const runtime = Runtime.defaultRuntime;

// Simple async API - no Effect boilerplate needed
export const PlayerAPI = {
  async getAll(): Promise<Player[]> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.getAll();
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },

  async search(query: string): Promise<Player[]> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.search(query);
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

  async removePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.removePlayerFromTeam(teamId, playerId);
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

  async deletePlayer(playerId: string): Promise<void> {
    const effect = Effect.gen(function* () {
      const service = yield* PlayerService;
      return yield* service.deletePlayer(playerId);
    });
    return await Runtime.runPromise(runtime)(
      Effect.provide(effect, PlayerServiceLive),
    );
  },
};
