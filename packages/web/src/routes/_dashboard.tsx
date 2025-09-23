import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { DashboardHeader } from '@/components/nav/header';
import { protectedMiddleware } from '@/lib/middleware';

const getDashboardData = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async () => {
    const { auth } = await import('@lax-db/core/auth');
    const { getWebRequest } = await import('@tanstack/react-start/server');

    const { headers } = getWebRequest();

    try {
      const session = await auth.api.getSession({ headers });

      if (!session?.user) {
        return {
          organizations: [],
          activeOrganization: null,
        };
      }

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

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async ({ location }) => {
    const { auth } = await import('@lax-db/core/auth');
    const { getWebRequest } = await import('@tanstack/react-start/server');

    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });

    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname || '/teams',
        },
      });
    }

    const isOrganizationRoute = location.pathname.startsWith('/organizations');

    const data = await getDashboardData();

    if (!isOrganizationRoute && !data.activeOrganization) {
      throw redirect({
        to: '/organizations/create',
        search: {
          redirect: location.pathname || '/teams',
        },
      });
    }

    return {
      user: session.user,
      organizations: data.organizations,
      activeOrganization: data.activeOrganization,
    };
  },
  loader: async () => {
    return await getDashboardData();
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <>
      <DashboardHeader />
      <Outlet />
    </>
  );
}
