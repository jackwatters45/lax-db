import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { authMiddleware } from '@/lib/middleware';

const getDashboardData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { organizationSlug: string }) => data)
  .handler(async ({ context, data }) => {
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
        auth.api.getFullOrganization({
          headers,
          query: {
            organizationSlug: data.organizationSlug,
          },
        }),
      ]);

      console.log({ organizations, activeOrganization });

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
  beforeLoad: async ({ location, params }) => {
    const data = await getDashboardData({
      data: { organizationSlug: params.organizationSlug },
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
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <SidebarInset className="flex h-screen flex-col">
          <Outlet />
        </SidebarInset>
      </main>
    </SidebarProvider>
  );
}
