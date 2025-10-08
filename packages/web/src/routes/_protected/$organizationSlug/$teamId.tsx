import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { authMiddleware } from '@/lib/middleware';

const getTeamDashboardData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(
    (data: { activeOrganizationId: string; teamId: string }) => data,
  )
  .handler(async ({ data, context }) => {
    const { auth } = await import('@lax-db/core/auth');

    try {
      if (!context.session?.user) {
        return {
          teams: [],
          activeTeam: null,
        };
      }

      const headers = context.headers;
      const [teams] = await Promise.all([
        auth.api.listOrganizationTeams({
          query: {
            organizationId: data.activeOrganizationId,
          },
          headers,
        }),
      ]);

      // Find the active team from the teamId parameter
      const activeTeam = teams?.find((team) => team.id === data.teamId) || null;
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
    } catch (error) {
      console.error('Team dashboard data error:', error);
      return {
        teams: [],
        activeTeam: null,
      };
    }
  });

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
  loader: async ({ params, context }) => {
    return await getTeamDashboardData({
      data: {
        activeOrganizationId: context.activeOrganization.id,
        teamId: params.teamId,
      },
    });
  },
});
