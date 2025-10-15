import { AuthService } from '@lax-db/core/auth';
import { OrganizationError } from '@lax-db/core/organization/organization.error';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { OrganizationSlugSchema } from '@lax-db/core/schema';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { Effect, Schema } from 'effect';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { authMiddleware } from '@/lib/middleware';

const GetDashboardDataSchema = Schema.Struct({
  ...OrganizationSlugSchema,
});

const getDashboardData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof GetDashboardDataSchema.Type) =>
    Schema.decodeSync(GetDashboardDataSchema)(data)
  )
  .handler(async ({ context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService;
        if (!context.session?.user) {
          return {
            organizations: [],
            activeOrganization: null,
            sidebarOpen: true,
          };
        }

        const headers = context.headers;

        const [organizations, activeOrganization] = yield* Effect.all(
          [
            Effect.tryPromise(() =>
              auth.auth.api.listOrganizationTeams({ headers })
            ).pipe(
              Effect.mapError(
                (cause) =>
                  new OrganizationError({
                    cause,
                    message: 'Failed to get teams',
                  })
              )
            ),
            Effect.tryPromise(() =>
              auth.auth.api.getFullOrganization({ headers })
            ).pipe(
              Effect.mapError(
                (cause) =>
                  new OrganizationError({
                    cause,
                    message: 'Failed to get active organization',
                  })
              )
            ),
          ],
          { concurrency: 'unbounded' }
        );

        const cookie = getRequestHeader('Cookie');
        const match = cookie?.match(/sidebar_state=([^;]+)/);
        const sidebarOpen = match?.[1] !== 'false';

        return {
          organizations,
          activeOrganization,
          sidebarOpen,
        };
      })
    )
  );

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
      activeOrganization,
      sidebarOpen: data.sidebarOpen,
    };
  },
  loader: async ({ params }) =>
    await getDashboardData({
      data: { organizationSlug: params.organizationSlug },
    }),
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
