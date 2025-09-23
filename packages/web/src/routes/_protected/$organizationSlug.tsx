import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { protectedMiddleware } from '@/lib/middleware';

const getDashboardData = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context }) => {
    const { auth } = await import('@lax-db/core/auth');

    try {
      if (!context.session?.user) {
        return {
          organizations: [],
          activeOrganization: null,
        };
      }

      const headers = context.headers;
      const [organizations, activeOrganization] = await Promise.all([
        auth.api.listOrganizations({ headers }),
        auth.api.getFullOrganization({ headers }),
      ]);

      return {
        organizations,
        activeOrganization,
      };
    } catch (error) {
      console.error('Dashboard data error:', error);
      return {
        organizations: [],
        activeOrganization: null,
      };
    }
  });

export const Route = createFileRoute('/_protected/$organizationSlug')({
  beforeLoad: async ({ location }) => {
    const data = await getDashboardData();

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
    };
  },
  loader: async () => {
    return await getDashboardData();
  },
});
