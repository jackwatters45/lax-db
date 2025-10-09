import type { TeamPlayerWithInfo } from '@lax-db/core/player/index';
import {
  AddPlayerToTeamInputSchema,
  BulkRemovePlayersFromTeamInputSchema,
  CreatePlayerInputSchema,
  DeletePlayerInputSchema,
  RemovePlayerFromTeamInputSchema,
} from '@lax-db/core/player/player.schema';
import type { PartialNullable } from '@lax-db/core/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
import { toast } from 'sonner';
import { authMiddleware } from '@/lib/middleware';
import {
  getTeamPlayersQK,
  type UpdatePlayerAndTeamInputSchema,
  useBulkDeletePlayersBase,
  useDeletePlayerBase,
  useUpdatePlayerBase,
} from '@/mutations/players';

// Update player
const useUpdatePlayer = (organizationId: string, teamId: string) => {
  const mutation = useUpdatePlayerBase(
    getTeamPlayersQK(organizationId, teamId),
  );

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
};

// Add player to team
export const AddPlayerWithTeamInputSchema = S.extend(
  CreatePlayerInputSchema,
  AddPlayerToTeamInputSchema.omit('playerId'),
);

export const addPlayerToTeamFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof AddPlayerWithTeamInputSchema.Type) =>
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
            playerId: newPlayer.publicId,
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
      const optimisticPlayer: TeamPlayerWithInfo = {
        publicId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        organizationId: variables.organizationId,
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
  .inputValidator((data: typeof RemovePlayerFromTeamInputSchema.Type) =>
    S.decodeSync(RemovePlayerFromTeamInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    await PlayerAPI.removePlayerFromTeam(data);
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
        old.filter((p) => p.publicId !== variables.playerId),
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

// Bulk remove players from team
export const bulkRemovePlayersFromTeamFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof BulkRemovePlayersFromTeamInputSchema.Type) =>
    S.decodeSync(BulkRemovePlayersFromTeamInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    await PlayerAPI.bulkRemovePlayersFromTeam(data);
  });

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
        old.filter((p) => !variables.playerIds.includes(p.publicId)),
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

// Bulk delete players
const useBulkDeletePlayers = (organizationId: string, teamId: string) =>
  useBulkDeletePlayersBase(getTeamPlayersQK(organizationId, teamId));

// Delete player
export const useDeletePlayer = (organizationId: string, teamId: string) =>
  useDeletePlayerBase(getTeamPlayersQK(organizationId, teamId));

// Link existing player to team (replace current player)
const LinkPlayerServerInputSchema = S.Struct({
  currentPlayerId: S.String,
  newPlayerId: S.String,
  newPlayerData: S.Struct({
    publicId: S.String,
    name: S.NullOr(S.String),
    email: S.NullOr(S.String),
    phone: S.NullOr(S.String),
    dateOfBirth: S.NullOr(S.String),
    organizationId: S.String,
  }),
  teamId: S.String,
  jerseyNumber: S.NullOr(S.Number),
  position: S.NullOr(S.String),
});

export const LinkPlayerInputSchema = S.Struct({
  currentPlayerId: S.String,
  newPlayerData: S.Struct({
    publicId: S.String,
    name: S.NullOr(S.String),
    email: S.NullOr(S.String),
    phone: S.NullOr(S.String),
    dateOfBirth: S.NullOr(S.String),
    organizationId: S.String,
  }),
  jerseyNumber: S.NullOr(S.Number),
  position: S.NullOr(S.String),
});

export const linkPlayerFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof LinkPlayerServerInputSchema.Type) =>
    S.decodeSync(LinkPlayerServerInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');

    // Remove current player from team
    await PlayerAPI.removePlayerFromTeam({
      teamId: data.teamId,
      playerId: data.currentPlayerId,
    });

    // Add new player to team
    await PlayerAPI.addPlayerToTeam({
      playerId: data.newPlayerData.publicId,
      teamId: data.teamId,
      jerseyNumber: data.jerseyNumber,
      position: data.position,
    });

    return data.newPlayerData;
  });

export function useLinkPlayer(organizationId: string, teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof LinkPlayerInputSchema.Type) =>
      linkPlayerFn({
        data: {
          ...data,
          newPlayerId: data.newPlayerData.publicId,
          teamId,
        },
      }),
    onMutate: async (variables, ctx) => {
      const queryKey = getTeamPlayersQK(organizationId, teamId);
      await ctx.client.cancelQueries({ queryKey });

      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
        old.map((player) =>
          player.publicId === variables.currentPlayerId
            ? {
                ...player,
                publicId: variables.newPlayerData.publicId,
                name: variables.newPlayerData.name,
                email: variables.newPlayerData.email,
                phone: variables.newPlayerData.phone,
                dateOfBirth: variables.newPlayerData.dateOfBirth,
                organizationId: variables.newPlayerData.organizationId,
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
  .inputValidator((data: typeof AddPlayerToTeamInputSchema.Type) =>
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
  DeletePlayerInputSchema,
  RemovePlayerFromTeamInputSchema,
  type UpdatePlayerAndTeamInputSchema as UpdatePlayerInputSchema,
};
