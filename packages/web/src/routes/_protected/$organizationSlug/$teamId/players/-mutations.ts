import type { TeamPlayerWithInfo } from '@lax-db/core/player/index';
import {
  AddPlayerToTeamInputSchema,
  CreatePlayerInputSchema,
  DeletePlayerInputSchema,
  RemovePlayerFromTeamInputSchema,
  UpdatePlayerInputSchema,
  UpdateTeamPlayerInputSchema,
} from '@lax-db/core/player/player.schema';
import type { PartialNullable } from '@lax-db/core/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
import { useMemo } from 'react';
import { toast } from 'sonner';
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

  const mutation = useMutation({
    // mutationKey: ['players', teamId],
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
      toast('An error occurred while updating the player');
    },
  });

  const handleUpdate = (
    playerId: string,
    updates: PartialNullable<TeamPlayerWithInfo>,
  ) => {
    mutation.mutate({
      ...updates,
      playerId,
      teamId,
    });
  };

  return {
    mutation,
    handleUpdate,
  };
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
    // onSettled: () => {
    //   queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    // },
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

// Link existing player to team (replace current player)
const LinkPlayerInputSchema = S.Struct({
  currentPlayerId: S.String,
  newPlayerId: S.String,
  teamId: S.String,
  jerseyNumber: S.NullOr(S.Number),
  position: S.NullOr(S.String),
});

export const linkPlayerFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof LinkPlayerInputSchema.Type) =>
    S.decodeSync(LinkPlayerInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');

    // Remove current player from team
    await PlayerAPI.removePlayerFromTeam({
      teamId: data.teamId,
      playerId: data.currentPlayerId,
    });

    // Add new player to team
    return await PlayerAPI.addPlayerToTeam({
      playerId: data.newPlayerId,
      teamId: data.teamId,
      jerseyNumber: data.jerseyNumber,
      position: data.position,
    });
  });

export function useLinkPlayer(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      currentPlayerId: string;
      existingPlayer: {
        id: string;
        name: string | null;
        email: string | null;
        phone: string | null;
        dateOfBirth: string | null;
        organizationId: string;
      };
      jerseyNumber: number | null;
      position: string | null;
    }) =>
      linkPlayerFn({
        data: {
          currentPlayerId: data.currentPlayerId,
          newPlayerId: data.existingPlayer.id,
          teamId,
          jerseyNumber: data.jerseyNumber,
          position: data.position,
        },
      }),
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
            player.playerId === variables.currentPlayerId
              ? {
                  ...player,
                  id: variables.existingPlayer.id,
                  playerId: variables.existingPlayer.id,
                  name: variables.existingPlayer.name,
                  email: variables.existingPlayer.email,
                  phone: variables.existingPlayer.phone,
                  dateOfBirth: variables.existingPlayer.dateOfBirth,
                  organizationId: variables.existingPlayer.organizationId,
                }
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

// Add existing player to team (without creating player)
export const addExistingPlayerToTeamFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof AddPlayerToTeamInputSchema.Type) =>
    S.decodeSync(AddPlayerToTeamInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.addPlayerToTeam(data);
  });

export function useAddExistingPlayerToTeam(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof AddPlayerToTeamInputSchema.Type) =>
      addExistingPlayerToTeamFn({ data }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    },
  });
}

// Combined hook
export function usePlayerMutations(teamId: string) {
  const addExisting = useAddExistingPlayerToTeam(teamId);
  const update = useUpdatePlayer(teamId);
  const add = useAddPlayerToTeam(teamId);
  const link = useLinkPlayer(teamId);
  const remove = useRemovePlayerFromTeam(teamId);
  const deletePlayer = useDeletePlayer(teamId);

  return useMemo(
    () => ({ addExisting, update, add, link, remove, delete: deletePlayer }),
    [addExisting, update, add, link, remove, deletePlayer],
  );
}

// Re-export schemas
export {
  RemovePlayerFromTeamInputSchema,
  DeletePlayerInputSchema,
  UpdatePlayerAndTeamInputSchema as UpdatePlayerInputSchema,
};
