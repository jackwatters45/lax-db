import type { PartialNullable } from '@lax-db/core/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
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
import { TeamHeader } from '../-components/team-header';
import {
  createEditablePlayerColumns,
  type TeamPlayerWithInfo,
} from './-components/players-columns';
import { PlayersFilterBar } from './-components/players-filterbar';
import { PlayersToolbar } from './-components/players-toolbar';
import {
  type AddPlayerWithTeamInputSchema,
  addPlayerToTeamFn,
  type DeletePlayerInputSchema,
  deletePlayerFn,
  getTeamPlayers,
  type RemovePlayerFromTeamInputSchema,
  removePlayerFromTeamFn,
  type UpdatePlayerInputSchema,
  updatePlayerFn,
} from './-server';

const searchParams = S.standardSchemaV1(
  S.Struct({
    editingId: S.String.pipe(S.optional),
  }),
);

// TODO: cmd for users
// TODO: add fields
// TODO: clean up migrations
export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players/',
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
  const {
    activeOrganization: { id: organizationId },
  } = Route.useRouteContext();

  const queryClient = useQueryClient();

  const { data: players = [] } = useQuery({
    queryKey: ['players', teamId],
    queryFn: () => getTeamPlayers({ data: { teamId } }),
  });

  const updatePlayerMutation = useMutation({
    mutationFn: (data: typeof UpdatePlayerInputSchema.Type) =>
      updatePlayerFn({ data }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['players', teamId] });
    },
  });

  const addPlayerMutation = useMutation({
    mutationFn: (data: typeof AddPlayerWithTeamInputSchema.Type) =>
      addPlayerToTeamFn({ data }),
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries({ queryKey: ['players', teamId] });

      const previousPlayers = ctx.client.getQueryData<TeamPlayerWithInfo[]>([
        'players',
        teamId,
      ]);

      const tempId = `temp-${Date.now()}`;
      const optimisticPlayer: TeamPlayerWithInfo = {
        id: tempId,
        organizationId: variables.organizationId,
        playerId: tempId,
        name: variables.name,
        email: variables.email || null,
        phone: variables.phone || null,
        dateOfBirth: variables.dateOfBirth || null,
        jerseyNumber: variables.jerseyNumber || null,
        position: variables.position || null,
        teamId: variables.teamId,
        userId: null,
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
      };

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(
        ['players', teamId],
        (old = []) => [...old, optimisticPlayer],
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

  const removePlayerMutation = useMutation({
    mutationFn: (data: typeof RemovePlayerFromTeamInputSchema.Type) =>
      removePlayerFromTeamFn({ data }),
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries({ queryKey: ['players', teamId] });

      const previousPlayers = ctx.client.getQueryData<TeamPlayerWithInfo[]>([
        'players',
        teamId,
      ]);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(
        ['players', teamId],
        (old = []) => old.filter((p) => p.playerId !== variables.playerId),
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

  const deletePlayerMutation = useMutation({
    mutationFn: (data: typeof DeletePlayerInputSchema.Type) =>
      deletePlayerFn({ data }),
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries({ queryKey: ['players', teamId] });

      const previousPlayers = ctx.client.getQueryData<TeamPlayerWithInfo[]>([
        'players',
        teamId,
      ]);

      ctx.client.setQueryData<TeamPlayerWithInfo[]>(
        ['players', teamId],
        (old = []) => old.filter((p) => p.playerId !== variables.playerId),
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
    if (!organizationId) return;

    addPlayerMutation.mutate({
      organizationId,
      teamId,
      name: '',
      email: null,
      phone: null,
      dateOfBirth: null,
      jerseyNumber: null,
      position: null,
      userId: null,
    });
  };

  const columns = createEditablePlayerColumns({
    organizationSlug,
    teamPlayers: players,
    actions: {
      onUpdate: (
        playerId: string,
        updates: PartialNullable<TeamPlayerWithInfo>,
      ) => {
        updatePlayerMutation.mutate({
          ...updates,
          playerId,
          teamId,
        });
      },
      onRemove: (playerId: string) => {
        removePlayerMutation.mutate({ teamId, playerId });
      },
      onDelete: (playerId: string) => {
        deletePlayerMutation.mutate({ playerId });
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

function PlayerCards({ players }: { players: TeamPlayerWithInfo[] }) {
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

function PlayerCard({ player }: { player: TeamPlayerWithInfo }) {
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
