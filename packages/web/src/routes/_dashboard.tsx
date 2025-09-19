import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { DashboardHeader } from '@/components/nav/header';

// Server function to check authentication
const checkAuth = createServerFn({ method: 'GET' })
  .validator(() => ({}))
  .handler(async ({ data }) => {
    const { auth } = await import('@lax-db/core/auth');
    const { getWebRequest } = await import('@tanstack/react-start/server');

    try {
      const request = getWebRequest();
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.session || !session?.user) {
        return {
          authenticated: false,
          user: null,
        };
      }

      return {
        authenticated: true,
        user: session.user,
      };
    } catch (error) {
      console.error('Auth check error:', error);
      return {
        authenticated: false,
        user: null,
      };
    }
  });

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async ({ location }) => {
    const authResult = await checkAuth();

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
