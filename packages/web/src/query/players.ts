import { PlayerService } from '@lax-db/core/player/player.service';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { OrganizationIdSchema } from '@lax-db/core/schema';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema } from 'effect';
import { authMiddleware } from '@/lib/middleware';

const GetOrganizationPlayersSchema = Schema.Struct({
  ...OrganizationIdSchema,
});

export const getOrganizationPlayers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof GetOrganizationPlayersSchema.Type) =>
    Schema.decodeSync(GetOrganizationPlayersSchema)(data),
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.getAll(data);
      }),
    ),
  );
