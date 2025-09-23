import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getWebRequest } from '@tanstack/react-start/server';
import { DashboardHeader } from '@/components/nav/header';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location, context }) => {
    const { headers } = getWebRequest();
    const session = await context.auth.api.getSession({ headers });

    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname || '/teams',
        },
      });
    }

    return {
      user: session.user,
      ...context,
    };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <>
      <DashboardHeader />
      <Outlet />
    </>
  );
}
