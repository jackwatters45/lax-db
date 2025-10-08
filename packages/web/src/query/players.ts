import { OrganizationIdSchema } from '@lax-db/core/player/player.schema';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
import { authMiddleware } from '@/lib/middleware';

const GetOrganizationPlayersSchema = S.Struct({
  organizationId: OrganizationIdSchema,
});

export const getOrganizationPlayers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof GetOrganizationPlayersSchema.Type) =>
    S.decodeSync(GetOrganizationPlayersSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.getAll({ organizationId: data.organizationId });
  });
