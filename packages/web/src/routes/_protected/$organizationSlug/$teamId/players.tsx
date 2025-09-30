import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
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

const UpdatePlayerInputSchema = S.Struct({
  playerId: S.String,
  teamId: S.String,
  name: S.optional(S.String),
  email: S.optional(S.NullOr(S.String)),
  phone: S.optional(S.NullOr(S.String)),
  dateOfBirth: S.optional(S.NullOr(S.String)),
  jerseyNumber: S.optional(S.NullOr(S.Number)),
  position: S.optional(S.NullOr(S.String)),
});

const updatePlayerFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof UpdatePlayerInputSchema.Type) =>
    S.decodeSync(UpdatePlayerInputSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    const { Effect, Runtime } = await import('effect');

    const { teamId, jerseyNumber, position, ...playerFields } = data;

    const runtime = Runtime.defaultRuntime;

    await Runtime.runPromise(runtime)(
      Effect.gen(function* () {
        const updates = [];

        if (Object.keys(playerFields).length > 1) {
          updates.push(
            Effect.promise(() => PlayerAPI.updatePlayer(playerFields)),
          );
        }

        if (jerseyNumber !== undefined || position !== undefined) {
          updates.push(
            Effect.promise(() =>
              PlayerAPI.updateTeamPlayer({
                teamId,
                playerId: data.playerId,
                jerseyNumber,
                position,
              }),
            ),
          );
        }

        if (updates.length > 0) {
          yield* Effect.all(updates, { concurrency: 'unbounded' });
        }
      }),
    );
  });

const searchParams = S.standardSchemaV1(
  S.Struct({
    editingId: S.String.pipe(S.optional),
  }),
);

// TODO: cmd for users
export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players',
)({
  component: RouteComponent,
  validateSearch: searchParams,
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
        <PlayersDataTable />
      </PageBody>
    </>
  );
}

function PlayersDataTable() {
  const { organizationSlug, teamId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: players = [] } = useQuery({
    queryKey: ['players', teamId],
    queryFn: () => getTeamPlayers({ data: { teamId } }),
  });

  const updatePlayerMutation = useMutation({
    mutationFn: (data: typeof UpdatePlayerInputSchema.Type) =>
      updatePlayerFn({ data }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['players', teamId] });

      const previousPlayers = queryClient.getQueryData<PlayerWithTeamInfo[]>([
        'players',
        teamId,
      ]);

      queryClient.setQueryData<PlayerWithTeamInfo[]>(
        ['players', teamId],
        (old = []) =>
          old.map((player) =>
            player.playerId === variables.playerId
              ? { ...player, ...variables }
              : player,
          ),
      );

      return { previousPlayers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlayers) {
        queryClient.setQueryData(['players', teamId], context.previousPlayers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    },
  });

  const handleAddPlayer = () => {
    const tempId = `temp-${Date.now()}`;
    const _newPlayer: PlayerWithTeamInfo = {
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
  };

  const columns = createEditablePlayerColumns({
    organizationSlug,
    teamId,
    actions: {
      onUpdate: (playerId: string, updates: Partial<PlayerWithTeamInfo>) => {
        updatePlayerMutation.mutate({
          playerId,
          teamId,
          ...updates,
        });
      },
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
