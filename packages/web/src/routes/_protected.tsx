import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { protectedMiddleware } from '@/lib/middleware';

const getSession = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context }) => context.session.user);

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const user = await getSession();

    if (!user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname || '/teams',
        },
      });
    }

    return {
      user,
    };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <>
      {/*<DashboardHeader />*/}
      <SidebarProvider>
        <AppSidebar />
        <main>
          <SidebarInset>
            <Outlet />
          </SidebarInset>
        </main>
      </SidebarProvider>
    </>
  );
}
