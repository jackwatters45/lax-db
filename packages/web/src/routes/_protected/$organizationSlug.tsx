import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { authMiddleware } from '@/lib/middleware';

const getDashboardData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: { organizationSlug: string }) => data)
  .handler(async ({ context }) => {
    const { auth } = await import('@lax-db/core/auth');
    const { getRequest } = await import('@tanstack/react-start/server');

    try {
      if (!context.session?.user) {
        return {
          organizations: [],
          activeOrganization: null,
          sidebarOpen: true,
        };
      }

      const headers = context.headers;
      const [organizations, activeOrganization] = await Promise.all([
        auth.api.listOrganizations({ headers }),
        auth.api.getFullOrganization({ headers }),
      ]);

      const request = getRequest();
      const cookie = request.headers.get('cookie');
      const match = cookie?.match(/sidebar_state=([^;]+)/);
      const sidebarOpen = match?.[1] !== 'false';

      return {
        organizations,
        activeOrganization,
        sidebarOpen,
      };
    } catch (error) {
      console.error('Dashboard data error:', error);
      return {
        organizations: [],
        activeOrganization: null,
        sidebarOpen: true,
      };
    }
  });

export const Route = createFileRoute('/_protected/$organizationSlug')({
  beforeLoad: async ({ location, params }) => {
    const data = await getDashboardData({
      data: { organizationSlug: params.organizationSlug },
    });

    const activeOrganization = data.activeOrganization;
    if (!activeOrganization) {
      throw redirect({
        to: '/organizations/create',
        search: {
          redirectUrl: location.pathname || '/teams',
        },
      });
    }

    return {
      organizations: data.organizations,
      activeOrganization: activeOrganization,
      sidebarOpen: data.sidebarOpen,
    };
  },
  loader: async ({ params }) => {
    return await getDashboardData({
      data: { organizationSlug: params.organizationSlug },
    });
  },
  component: OrganizationLayout,
});

function OrganizationLayout() {
  const { sidebarOpen } = Route.useRouteContext();

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar />
      <SidebarInset className="flex h-screen flex-col">
        <div className="flex h-full flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
