import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
import { useMemo } from 'react';
import {
  DataTableBody,
  DataTableContent,
  DataTableHeader,
  DataTableProvider,
  DataTableRoot,
} from '@/components/data-table/data-table';
import { PageBody } from '@/components/layout/page-content';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { authMiddleware } from '@/lib/middleware';
import { TeamIdSchema } from '@/lib/schema';
import { TeamHeader } from '../-components/team-header';
import { PlayerCards } from './-components/players-cards';
import { createEditablePlayerColumns } from './-components/players-columns';
import { PlayersFilterBar } from './-components/players-filterbar';
import { PlayersToolbar } from './-components/players-toolbar';

const getTeamPlayers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: typeof TeamIdSchema.Type) =>
    S.decodeSync(TeamIdSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.getTeamPlayers(data.teamId);
  });

// TODO: cmd for users - logic
// TODO: add fields
// TODO: clean up
// TODO: make team breadcrumb a dropdown
// TODO: root players page
export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players/',
)({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    await context.queryClient.prefetchQuery({
      queryKey: ['players', params.teamId],
      queryFn: () => getTeamPlayers({ data: { teamId: params.teamId } }),
    });
  },
});

function RouteComponent() {
  return (
    <>
      <Header />
      <PageBody className="py-4">
        <Tabs defaultValue="list">
          <PlayersDataTable />
        </Tabs>
      </PageBody>
    </>
  );
}

function PlayersDataTable() {
  const { organizationSlug, teamId } = Route.useParams();
  const {
    activeOrganization: { id: organizationId },
  } = Route.useRouteContext();

  const { data: players = [] } = useQuery({
    queryKey: ['players', teamId],
    queryFn: () => getTeamPlayers({ data: { teamId } }),
  });

  const columns = useMemo(
    () =>
      createEditablePlayerColumns({
        organizationSlug,
        teamId,
      }),
    [organizationSlug, teamId],
  );

  return (
    <DataTableProvider columns={columns} data={players} showAllRows={true}>
      <DataTableRoot>
        <PlayersFilterBar
          organizationId={organizationId}
          teamId={teamId}
          excludePlayerIds={players.map((p) => p.playerId)}
        />
        <TabsContent value="list">
          <DataTableContent>
            <DataTableHeader />
            <DataTableBody />
          </DataTableContent>
        </TabsContent>
        <TabsContent value="cards" className="container">
          <PlayerCards players={players} />
        </TabsContent>
        <PlayersToolbar />
      </DataTableRoot>
    </DataTableProvider>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();
  const { activeTeam } = Route.useRouteContext();

  return (
    <TeamHeader organizationSlug={organizationSlug} activeTeam={activeTeam}>
      <BreadcrumbItem>
        <BreadcrumbLink className="max-w-full truncate" title="Teams" asChild>
          <Link to="/$organizationSlug" params={{ organizationSlug }}>
            Teams
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink title={activeTeam.name} asChild>
          <Link
            to="/$organizationSlug/$teamId"
            params={{ organizationSlug, teamId: activeTeam.id }}
          >
            {activeTeam.name}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink title="Players" asChild>
          <Link
            to="/$organizationSlug/$teamId/players"
            params={{ organizationSlug, teamId: activeTeam.id }}
          >
            Players
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </TeamHeader>
  );
}
