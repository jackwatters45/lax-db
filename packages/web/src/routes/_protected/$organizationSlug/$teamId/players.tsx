import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
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
import { authMiddleware } from '@/lib/middleware';
import { TeamHeader } from './-components/team-header';
import {
  createPlayerColumns,
  type PlayerWithTeamInfo,
} from './-players/players-columns';
import { PlayersFilterbar } from './-players/players-filterbar';
import { PlayersToolbar } from './-players/players-toolbar';

const getTeamPlayers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: { teamId: string }) => data)
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.getTeamPlayers(data.teamId);
  });

export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const players = await getTeamPlayers({ data: { teamId: params.teamId } });
    return { players };
  },
});

// add players logic
// add fields
function RouteComponent() {
  const { players: initialPlayers } = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const [players, setPlayers] = useState<PlayerWithTeamInfo[]>(initialPlayers);

  const _handleAddPlayer = () => {
    const newPlayer: PlayerWithTeamInfo = {
      id: `temp-${Date.now()}`,
      playerId: `temp-${Date.now()}`,
      name: '',
      email: null,
      phone: null,
      dateOfBirth: null,
      jerseyNumber: null,
      position: null,
      isNew: true,
    };
    setPlayers((prev) => [...prev, newPlayer]);
  };

  const handleDataChange = () => {
    window.location.reload();
  };

  const columns = createPlayerColumns(teamId, handleDataChange);

  return (
    <>
      <Header />
      <PageBody className="py-4">
        <PlayersDataTable players={players} columns={columns} />
      </PageBody>
    </>
  );
}

function PlayersDataTable({
  columns,
  players,
}: {
  columns: ColumnDef<PlayerWithTeamInfo>[];
  players: PlayerWithTeamInfo[];
}) {
  return (
    <DataTableProvider columns={columns} data={players} showAllRows={true}>
      <DataTableRoot>
        <PlayersFilterbar />
        <DataTableContent>
          <DataTableHeader />
          <DataTableBody />
        </DataTableContent>
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
