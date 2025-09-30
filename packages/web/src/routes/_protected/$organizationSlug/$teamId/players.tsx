import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { authMiddleware } from '@/lib/middleware';
import { TeamIdSchema } from '@/lib/schema';
import { TeamHeader } from './-components/team-header';
import {
  createEditablePlayerColumns,
  type PlayerWithTeamInfo,
} from './-players/players-columns';
import { PlayersFilterBar } from './-players/players-filterbar';
import { PlayersToolbar } from './-players/players-toolbar';

const getTeamPlayers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: typeof TeamIdSchema.Type) =>
    S.decodeSync(TeamIdSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.getTeamPlayers(data.teamId);
  });

const searchParams = S.standardSchemaV1(
  S.Struct({
    editingId: S.String.pipe(S.optional),
  }),
);

export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players',
)({
  component: RouteComponent,
  validateSearch: searchParams,
  loader: async ({ params }) => {
    const players = await getTeamPlayers({ data: { teamId: params.teamId } });
    return { players };
  },
});

function RouteComponent() {
  return (
    <>
      <Header />
      <PageBody className="py-4">
        <PlayersDataTable />
      </PageBody>
    </>
  );
}

//
// TODO: alert dialog action component
// TODO: connect to backend - useMutation - remove players state part?
// TODO: add fields + db
// TODO: checkbox
// TODO: filters, sort, etc
function PlayersDataTable() {
  const { players: initialPlayers } = Route.useLoaderData();
  const { organizationSlug, teamId } = Route.useParams();

  const [players, setPlayers] = useState<PlayerWithTeamInfo[]>(initialPlayers);

  const handleAddPlayer = () => {
    const tempId = `temp-${Date.now()}`;
    const newPlayer: PlayerWithTeamInfo = {
      id: tempId,
      playerId: tempId,
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

  const handleSavePlayer = async (
    id: string,
    updatedPlayer: PlayerWithTeamInfo,
  ) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? updatedPlayer : p)));
  };

  const columns = createEditablePlayerColumns({
    organizationSlug,
    teamId,
    actions: {
      onSave: handleSavePlayer,
      setPlayers,
    },
  });

  return (
    <Tabs defaultValue="list">
      <DataTableProvider columns={columns} data={players} showAllRows={true}>
        <DataTableRoot>
          <PlayersFilterBar onAddPlayer={handleAddPlayer} />
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
    </Tabs>
  );
}

function PlayerCards({ players }: { players: PlayerWithTeamInfo[] }) {
  return (
    <div className="xl:gris-cols-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...players, ...players, ...players, ...players, ...players].map(
        (player, i) => (
          <PlayerCard key={`${player.id}-${i}`} player={player} />
        ),
      )}
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerWithTeamInfo }) {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle>{player.name}</CardTitle>
        <CardDescription>{player.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">1</div>
            <div className="grid gap-2">
              <div className="flex items-center">2</div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">Footer</CardFooter>
    </Card>
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
