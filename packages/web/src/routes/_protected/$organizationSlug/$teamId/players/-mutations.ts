import type { TeamPlayerWithInfo } from '@lax-db/core/player/index';
import {
  AddPlayerToTeamInputSchema,
  CreatePlayerInputSchema,
  DeletePlayerInputSchema,
  RemovePlayerFromTeamInputSchema,
  UpdatePlayerInputSchema,
  UpdateTeamPlayerInputSchema,
} from '@lax-db/core/player/player.schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
import { authMiddleware } from '@/lib/middleware';

// Update player
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

export function useUpdatePlayer(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof UpdatePlayerAndTeamInputSchema.Type) =>
      updatePlayerFn({ data }),
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries({ queryKey: ['players', teamId] });
      const previousPlayers = ctx.client.getQueryData<TeamPlayerWithInfo[]>([
        'players',
        teamId,
      ]);
      ctx.client.setQueryData<TeamPlayerWithInfo[]>(
        ['players', teamId],
        (old = []) =>
          old.map((player) =>
            player.playerId === variables.playerId
              ? { ...player, ...variables }
              : player,
          ),
      );
      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(['players', teamId], context.previousPlayers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    },
  });
}

// Add player to team
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

export function useAddPlayerToTeam(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof AddPlayerWithTeamInputSchema.Type) =>
      addPlayerToTeamFn({ data }),
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries({ queryKey: ['players', teamId] });

      const previousPlayers = ctx.client.getQueryData<TeamPlayerWithInfo[]>([
        'players',
        teamId,
      ]);

      const tempId = `temp-${Date.now()}`;
      const optimisticPlayer: TeamPlayerWithInfo = {
        id: tempId,
        organizationId: variables.organizationId,
        playerId: tempId,
        name: variables.name,
        email: variables.email || null,
        phone: variables.phone || null,
        dateOfBirth: variables.dateOfBirth || null,
        jerseyNumber: variables.jerseyNumber || null,
        position: variables.position || null,
        teamId: variables.teamId,
        userId: null,
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
      };

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(
        ['players', teamId],
        (old = []) => [...old, optimisticPlayer],
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(['players', teamId], context.previousPlayers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    },
  });
}

// Remove player from team
export const removePlayerFromTeamFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof RemovePlayerFromTeamInputSchema.Type) =>
    S.decodeSync(RemovePlayerFromTeamInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    await PlayerAPI.removePlayerFromTeam(data);
  });

export function useRemovePlayerFromTeam(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof RemovePlayerFromTeamInputSchema.Type) =>
      removePlayerFromTeamFn({ data }),
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries({ queryKey: ['players', teamId] });

      const previousPlayers = ctx.client.getQueryData<TeamPlayerWithInfo[]>([
        'players',
        teamId,
      ]);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(
        ['players', teamId],
        (old = []) => old.filter((p) => p.playerId !== variables.playerId),
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(['players', teamId], context.previousPlayers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    },
  });
}

// Delete player
export const deletePlayerFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof DeletePlayerInputSchema.Type) =>
    S.decodeSync(DeletePlayerInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    await PlayerAPI.deletePlayer(data);
  });

export function useDeletePlayer(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof DeletePlayerInputSchema.Type) =>
      deletePlayerFn({ data }),
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries({ queryKey: ['players', teamId] });

      const previousPlayers = ctx.client.getQueryData<TeamPlayerWithInfo[]>([
        'players',
        teamId,
      ]);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(
        ['players', teamId],
        (old = []) => old.filter((p) => p.playerId !== variables.playerId),
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(['players', teamId], context.previousPlayers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    },
  });
}

// Combined hook
export function usePlayerMutations(teamId: string) {
  return {
    update: useUpdatePlayer(teamId),
    add: useAddPlayerToTeam(teamId),
    remove: useRemovePlayerFromTeam(teamId),
    delete: useDeletePlayer(teamId),
  };
}

// Re-export schemas
export {
  RemovePlayerFromTeamInputSchema,
  DeletePlayerInputSchema,
  UpdatePlayerAndTeamInputSchema as UpdatePlayerInputSchema,
};
