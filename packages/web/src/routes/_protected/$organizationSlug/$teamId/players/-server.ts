import {
  AddPlayerToTeamInputSchema,
  CreatePlayerInputSchema,
  DeletePlayerInputSchema,
  RemovePlayerFromTeamInputSchema,
  UpdatePlayerInputSchema,
  UpdateTeamPlayerInputSchema,
} from '@lax-db/core/player/player.schema';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
import { authMiddleware } from '@/lib/middleware';
import { TeamIdSchema } from '@/lib/schema';

export const getTeamPlayers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: typeof TeamIdSchema.Type) =>
    S.decodeSync(TeamIdSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.getTeamPlayers(data.teamId);
  });

export const UpdatePlayerAndTeamInputSchema = S.extend(
  UpdatePlayerInputSchema,
  UpdateTeamPlayerInputSchema,
);

export const updatePlayerFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof UpdatePlayerAndTeamInputSchema.Type) =>
    S.decodeSync(UpdatePlayerAndTeamInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    const { Effect, Runtime } = await import('effect');

    const { teamId, jerseyNumber, position, ...playerFields } = data;

    const runtime = Runtime.defaultRuntime;

    await Runtime.runPromise(runtime)(
      Effect.gen(function* () {
        const updates = [];

        if (Object.keys(playerFields).length > 1) {
          updates.push(
            Effect.promise(() => PlayerAPI.updatePlayer(playerFields)),
          );
        }

        if (jerseyNumber !== undefined || position !== undefined) {
          updates.push(
            Effect.promise(() =>
              PlayerAPI.updateTeamPlayer({
                teamId,
                playerId: data.playerId,
                jerseyNumber,
                position,
              }),
            ),
          );
        }

        if (updates.length > 0) {
          yield* Effect.all(updates, { concurrency: 'unbounded' });
        }
      }),
    );
  });

export const AddPlayerWithTeamInputSchema = S.extend(
  CreatePlayerInputSchema,
  AddPlayerToTeamInputSchema.omit('playerId'),
);
export const addPlayerToTeamFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof AddPlayerWithTeamInputSchema.Type) =>
    S.decodeSync(AddPlayerWithTeamInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    const { Effect, Runtime } = await import('effect');

    const runtime = Runtime.defaultRuntime;

    const player = await Runtime.runPromise(runtime)(
      Effect.gen(function* () {
        const newPlayer = yield* Effect.promise(() =>
          PlayerAPI.create({
            organizationId: data.organizationId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            userId: data.userId,
          }),
        );

        yield* Effect.promise(() =>
          PlayerAPI.addPlayerToTeam({
            playerId: newPlayer.id,
            teamId: data.teamId,
            jerseyNumber: data.jerseyNumber,
            position: data.position,
          }),
        );

        return newPlayer;
      }),
    );

    return player;
  });

export const removePlayerFromTeamFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof RemovePlayerFromTeamInputSchema.Type) =>
    S.decodeSync(RemovePlayerFromTeamInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    await PlayerAPI.removePlayerFromTeam(data);
  });

export const deletePlayerFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof DeletePlayerInputSchema.Type) =>
    S.decodeSync(DeletePlayerInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    await PlayerAPI.deletePlayer(data);
  });

export {
  RemovePlayerFromTeamInputSchema,
  DeletePlayerInputSchema,
  UpdatePlayerAndTeamInputSchema as UpdatePlayerInputSchema,
};
