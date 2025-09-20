import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { DashboardHeader } from '@/components/nav/header';

// Server function to check authentication and get organizations
const checkAuthAndGetOrganizations = createServerFn({ method: 'GET' })
  .validator(() => ({}))
  .handler(async () => {
    const { auth } = await import('@lax-db/core/auth');
    const { getWebRequest, getCookie } = await import(
      '@tanstack/react-start/server'
    );

    try {
      const request = getWebRequest();
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.session || !session?.user) {
        return {
          authenticated: false,
          user: null,
          organizations: [],
          activeOrganization: null,
        };
      }

      // Get user's organizations
      const organizations = await auth.api.listOrganizations({
        headers: request.headers,
      });

      // Get active organization from cookie
      const activeOrgId = getCookie('active-organization-id');

      // Find the active organization or default to first
      let activeOrganization = null;
      if (organizations?.length > 0) {
        if (activeOrgId) {
          activeOrganization =
            organizations.find((org) => org.id === activeOrgId) ||
            organizations[0];
        } else {
          activeOrganization = organizations[0];
        }
      }

      return {
        authenticated: true,
        user: session.user,
        organizations: organizations || [],
        activeOrganization,
      };
    } catch (error) {
      console.error('Auth check error:', error);
      return {
        authenticated: false,
        user: null,
        organizations: [],
        activeOrganization: null,
      };
    }
  });

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async ({ location }) => {
    const authResult = await checkAuthAndGetOrganizations();

    if (!authResult.authenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname || '/teams',
        },
      });
    }

    return {
      user: authResult.user,
      organizations: authResult.organizations,
      activeOrganization: authResult.activeOrganization,
    };
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
