import { AuthService } from '@lax-db/core/auth';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { TeamOperationError } from '@lax-db/core/team/team.error';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Effect } from 'effect';
import { authMiddleware } from '@/lib/middleware';

const getTeamDashboardData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(
    (data: { activeOrganizationId: string; teamId: string }) => data
  )
  .handler(async ({ data, context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService;

        if (!context.session?.user) {
          return {
            teams: [],
            activeTeam: null,
          };
        }

        const headers = context.headers;
        const teams = yield* Effect.tryPromise(() =>
          auth.auth.api.listOrganizationTeams({
            query: {
              organizationId: data.activeOrganizationId,
            },
            headers,
          })
        ).pipe(
          Effect.mapError(
            (cause) =>
              new TeamOperationError({
                message: 'Failed to list organization teams',
                cause,
              })
          )
        );

        // Find the active team from the teamId parameter
        const activeTeam =
          teams?.find((team) => team.id === data.teamId) || null;
        if (!activeTeam) {
          throw redirect({
            to: '/$organizationSlug',
            params: { organizationSlug: data.activeOrganizationId },
          });
        }

        return {
          teams,
          activeTeam,
        };
      })
    )
  );

export const Route = createFileRoute('/_protected/$organizationSlug/$teamId')({
  beforeLoad: async ({ params, context }) => {
    const data = await getTeamDashboardData({
      data: {
        activeOrganizationId: context.activeOrganization.id,
        teamId: params.teamId,
      },
    });

    const activeTeam = data.activeTeam;
    if (!activeTeam) {
      throw redirect({
        to: '/$organizationSlug',
        params: { organizationSlug: context.activeOrganization.id },
      });
    }

    return {
      organizations: context.organizations,
      activeOrganization: context.activeOrganization,
      teams: data.teams.map((team) => ({
        id: team.id,
        name: team.name,
      })),
      activeTeam,
    };
  },
  loader: async ({ params, context }) =>
    await getTeamDashboardData({
      data: {
        activeOrganizationId: context.activeOrganization.id,
        teamId: params.teamId,
      },
    }),
});
