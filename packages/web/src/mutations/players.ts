import type { TeamPlayerWithInfo } from '@lax-db/core/player/index';
import {
  BulkDeletePlayersInputSchema,
  DeletePlayerInputSchema,
  UpdatePlayerInputSchema,
  UpdateTeamPlayerInputSchema,
} from '@lax-db/core/player/player.schema';
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

export function useUpdatePlayerBase(queryKey: readonly string[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof UpdatePlayerAndTeamInputSchema.Type) =>
      updatePlayerFn({ data }),
    onMutate: async (variables, ctx) => {
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
        queryClient.setQueryData(queryKey, context.previousPlayers);
      }
      toast.error('Failed to update player');
    },
  });
}
// Bulk delete players
export const bulkDeletePlayersFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof BulkDeletePlayersInputSchema.Type) =>
    S.decodeSync(BulkDeletePlayersInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    await PlayerAPI.bulkDeletePlayers(data);
  });

export function useBulkDeletePlayersBase(queryKey: readonly string[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof BulkDeletePlayersInputSchema.Type) =>
      bulkDeletePlayersFn({ data }),
    onMutate: async (variables, ctx) => {
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
        queryClient.setQueryData(queryKey, context.previousPlayers);
      }
      toast.error('Failed to delete players');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
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

export function useDeletePlayerBase(queryKey: readonly string[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof DeletePlayerInputSchema.Type) =>
      deletePlayerFn({ data }),
    onMutate: async (variables, ctx) => {
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
        queryClient.setQueryData(queryKey, context.previousPlayers);
      }
      toast.error('Failed to delete player');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
