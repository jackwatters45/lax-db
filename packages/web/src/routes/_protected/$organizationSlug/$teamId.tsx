import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { protectedMiddleware } from '@/lib/middleware';

const getTeamDashboardData = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator((data: { teamId: string }) => data)
  .handler(async ({ data, context }) => {
    const { auth } = await import('@lax-db/core/auth');

    try {
      if (!context.session?.user) {
        return {
          organizations: [],
          activeOrganization: null,
          teams: [],
          activeTeam: null,
        };
      }

      const headers = context.headers;
      const [organizations, activeOrganization, teams] = await Promise.all([
        auth.api.listOrganizations({ headers }),
        auth.api.getFullOrganization({ headers }),
        auth.api.listOrganizationTeams({ headers }),
      ]);

      // Find the active team from the teamId parameter
      const activeTeam =
        teams?.find((team: any) => team.id === data.teamId) || null;

      return {
        organizations,
        activeOrganization,
        teams: teams || [],
        activeTeam,
      };
    } catch (error) {
      console.error('Team dashboard data error:', error);
      return {
        organizations: [],
        activeOrganization: null,
        teams: [],
        activeTeam: null,
      };
    }
  });

export const Route = createFileRoute('/_protected/$organizationSlug/$teamId')({
  beforeLoad: async ({ location, params }) => {
    const data = await getTeamDashboardData({
      data: { teamId: params.teamId },
    });

    const activeOrganization = data.activeOrganization;
    if (!activeOrganization) {
      throw redirect({
        to: '/organizations/create',
        search: {
          redirect: location.pathname || '/teams',
        },
      });
    }

    return {
      organizations: data.organizations,
      activeOrganization: activeOrganization,
      teams: data.teams,
      activeTeam: data.activeTeam,
    };
  },
  loader: async ({ params }) => {
    return await getTeamDashboardData({
      data: { teamId: params.teamId },
    });
  },
});
