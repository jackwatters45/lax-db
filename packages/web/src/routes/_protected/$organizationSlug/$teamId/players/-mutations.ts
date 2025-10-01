import type { TeamPlayerWithInfo } from '@lax-db/core/player/index';
import {
  AddPlayerToTeamInputSchema,
  BulkDeletePlayersInputSchema,
  BulkRemovePlayersFromTeamInputSchema,
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
import { toast } from 'sonner';
import { authMiddleware } from '@/lib/middleware';

export const getTeamPlayersQK = (organizationId: string, teamId: string) =>
  [organizationId, teamId, 'players'] as const;

export const getOrgPlayersQK = (organizationId: string) =>
  [organizationId, 'players'] as const;

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

export function useUpdatePlayer(organizationId: string, teamId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: typeof UpdatePlayerAndTeamInputSchema.Type) =>
      updatePlayerFn({ data }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });
      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
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
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error('Failed to update player');
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

export function useAddPlayerToTeam(organizationId: string, teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof AddPlayerWithTeamInputSchema.Type) =>
      addPlayerToTeamFn({ data }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

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

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) => [
        ...old,
        optimisticPlayer,
      ]);

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error('Failed to add player to team');
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

export const bulkRemovePlayersFromTeamFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof BulkRemovePlayersFromTeamInputSchema.Type) =>
    S.decodeSync(BulkRemovePlayersFromTeamInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    await PlayerAPI.bulkRemovePlayersFromTeam(data);
  });

export const bulkDeletePlayersFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof BulkDeletePlayersInputSchema.Type) =>
    S.decodeSync(BulkDeletePlayersInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    await PlayerAPI.bulkDeletePlayers(data);
  });

export function useRemovePlayerFromTeam(
  organizationId: string,
  teamId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof RemovePlayerFromTeamInputSchema.Type) =>
      removePlayerFromTeamFn({ data }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
        old.filter((p) => p.playerId !== variables.playerId),
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error('Failed to remove player from team');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamPlayersQK(organizationId, teamId),
      });
    },
  });
}

export function useBulkRemovePlayersFromTeam(
  organizationId: string,
  teamId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof BulkRemovePlayersFromTeamInputSchema.Type) =>
      bulkRemovePlayersFromTeamFn({ data }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
        old.filter((p) => !variables.playerIds.includes(p.playerId)),
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error('Failed to remove players from team');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamPlayersQK(organizationId, teamId),
      });
    },
  });
}

export function useBulkDeletePlayers(organizationId: string, teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof BulkDeletePlayersInputSchema.Type) =>
      bulkDeletePlayersFn({ data }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
        old.filter((p) => !variables.playerIds.includes(p.playerId)),
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error('Failed to delete players');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamPlayersQK(organizationId, teamId),
      });
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

export function useDeletePlayer(organizationId: string, teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof DeletePlayerInputSchema.Type) =>
      deletePlayerFn({ data }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
        old.filter((p) => p.playerId !== variables.playerId),
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error('Failed to delete player');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamPlayersQK(organizationId, teamId),
      });
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

export function useLinkPlayer(organizationId: string, teamId: string) {
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
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
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
        queryClient.setQueryData(
          getTeamPlayersQK(organizationId, teamId),
          context.previousPlayers,
        );
      }
      toast.error('Failed to link player');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamPlayersQK(organizationId, teamId),
      });
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

export function useAddExistingPlayerToTeam(
  organizationId: string,
  teamId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof AddPlayerToTeamInputSchema.Type) =>
      addExistingPlayerToTeamFn({ data }),
    onError: () => {
      toast.error('Failed to add existing player to team');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamPlayersQK(organizationId, teamId),
      });
    },
  });
}

// Combined hook
export function usePlayerMutations(organizationId: string, teamId: string) {
  const addExisting = useAddExistingPlayerToTeam(organizationId, teamId);
  const update = useUpdatePlayer(organizationId, teamId);
  const add = useAddPlayerToTeam(organizationId, teamId);
  const link = useLinkPlayer(organizationId, teamId);
  const remove = useRemovePlayerFromTeam(organizationId, teamId);
  const deletePlayer = useDeletePlayer(organizationId, teamId);
  const bulkDelete = useBulkDeletePlayers(organizationId, teamId);
  const bulkRemove = useBulkRemovePlayersFromTeam(organizationId, teamId);

  return {
    addExisting,
    update,
    add,
    link,
    remove,
    delete: deletePlayer,
    bulkDelete,
    bulkRemove,
  };
}

// Re-export schemas
export {
  RemovePlayerFromTeamInputSchema,
  DeletePlayerInputSchema,
  UpdatePlayerAndTeamInputSchema as UpdatePlayerInputSchema,
};
