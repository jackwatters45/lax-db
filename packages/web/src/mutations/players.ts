import {
  BulkDeletePlayersInput,
  DeletePlayerInput,
  PositionSchema,
  type TeamPlayerWithInfo,
} from '@lax-db/core/player/player.schema';
import { PlayerService } from '@lax-db/core/player/player.service';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import {
  EmailSchema,
  NullableJerseyNumberSchema,
  NullablePlayerNameSchema,
  PlayerIdSchema,
  TeamIdSchema,
} from '@lax-db/core/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema } from 'effect';
import { toast } from 'sonner';
import { authMiddleware } from '@/lib/middleware';

export const getTeamPlayersQK = (organizationId: string, teamId: string) =>
  [organizationId, teamId, 'players'] as const;

export const getOrgPlayersQK = (organizationId: string) =>
  [organizationId, 'players'] as const;

export class UpdatePlayerAndTeamInput extends Schema.Class<UpdatePlayerAndTeamInput>(
  'UpdatePlayerAndTeamInput',
)({
  ...PlayerIdSchema,
  ...TeamIdSchema,
  name: Schema.optional(NullablePlayerNameSchema),
  email: Schema.optional(Schema.NullOr(EmailSchema)),
  phone: Schema.optional(Schema.NullOr(Schema.String)),
  dateOfBirth: Schema.optional(Schema.NullOr(Schema.String)),
  jerseyNumber: Schema.optional(NullableJerseyNumberSchema),
  position: Schema.optional(PositionSchema),
}) {}

export const updatePlayerFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof UpdatePlayerAndTeamInput.Type) =>
    Schema.decodeSync(UpdatePlayerAndTeamInput)(data),
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        const updates = [];
        const { teamId, jerseyNumber, position, ...playerFields } = data;

        if (Object.keys(playerFields).length > 1) {
          updates.push(playerService.updatePlayer(playerFields));
        }

        if (jerseyNumber !== undefined || position !== undefined) {
          updates.push(
            playerService.updateTeamPlayer({
              teamId,
              playerId: data.playerId,
              jerseyNumber,
              position,
            }),
          );
        }

        if (updates.length > 0) {
          yield* Effect.all(updates, { concurrency: 'unbounded' });
        }
      }),
    ),
  );

export function useUpdatePlayerBase(queryKey: readonly string[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof UpdatePlayerAndTeamInput.Type) =>
      updatePlayerFn({ data }),
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries({ queryKey });
      const previousPlayers =
        ctx.client.getQueryData<TeamPlayerWithInfo[]>(queryKey);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(queryKey, (old = []) =>
        old.map((player) =>
          player.publicId === variables.playerId
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
  .inputValidator((data: typeof BulkDeletePlayersInput.Type) =>
    Schema.decodeSync(BulkDeletePlayersInput)(data),
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.bulkDeletePlayers(data);
      }),
    ),
  );

export function useBulkDeletePlayersBase(queryKey: readonly string[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof BulkDeletePlayersInput.Type) =>
      bulkDeletePlayersFn({ data }),
    onMutate: async (variables, ctx) => {
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
  .inputValidator((data: typeof DeletePlayerInput.Type) =>
    Schema.decodeSync(DeletePlayerInput)(data),
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.deletePlayer(data);
      }),
    ),
  );

export function useDeletePlayerBase(queryKey: readonly string[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: typeof DeletePlayerInput.Type) =>
      deletePlayerFn({ data }),
    onMutate: async (variables, ctx) => {
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
        queryClient.setQueryData(queryKey, context.previousPlayers);
      }
      toast.error('Failed to delete player');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
