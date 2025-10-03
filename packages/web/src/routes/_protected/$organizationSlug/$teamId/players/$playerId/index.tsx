import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { PageBody, PageContainer } from '@/components/layout/page-content';
import {
  BreadcrumbDropdown,
  BreadcrumbDropdownContent,
  BreadcrumbDropdownItem,
  BreadcrumbDropdownLabel,
  BreadcrumbDropdownSeparator,
  BreadcrumbDropdownTrigger,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { PlayerHeader } from './-components/player-header';
import { PlayerInfo } from './-components/player-info';
import { playerInfo } from './-data-2';
import {
  ActiveGoals,
  AssignedResources,
  ContactInformation,
  PlayerOverview,
  QuickActions,
  RecentNotes,
  SeasonStatistics,
  UpcomingEvents,
} from './-old-components';
import { mockPlayerDetails } from './-utils';

// Server function for getting player details
const getPlayerDetails = createServerFn({ method: 'GET' })
  .validator((data: { playerId: string }) => data)
  .handler(async ({ data }) => {
    console.log('Getting player details for:', data.playerId);
    // TODO: Replace with actual API call
    // const { PlayerDevelopmentAPI } = await import('@lax-db/core/player-development/index');
    // return await PlayerDevelopmentAPI.getPlayerProfile(data.playerId, headers);

    return mockPlayerDetails;
  });

const getPlayerPermissions = createServerFn().handler(async () => {
  return {
    canEdit: true,
    canCreateNotes: true,
    canAssess: true,
    canAssignResources: true,
    canSetGoals: true,
    canViewSensitive: true,
  };
});

export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players/$playerId/',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const [player, permissions] = await Promise.all([
      getPlayerDetails({ data: { playerId: params.playerId } }),
      getPlayerPermissions(),
    ]);

    return { player, permissions };
  },
});

function RouteComponent() {
  const { organizationSlug, teamId } = Route.useParams();
  const { player, permissions } = Route.useLoaderData();

  return (
    <>
      <Header />
      <PageBody>
        <PageContainer>
          <PlayerInfo
            organizationSlug={organizationSlug}
            teamId={teamId}
            playerInfo={playerInfo}
            canEdit={permissions.canEdit}
          />
          <div className="space-y-4">
            {permissions.canViewSensitive && (
              <ContactInformation player={player} />
            )}
            <PlayerOverview player={player} />
            <QuickActions
              playerId={player.id}
              organizationSlug={organizationSlug}
              permissions={{
                canCreateNotes: permissions.canCreateNotes,
                canAssess: permissions.canAssess,
                canAssignResources: permissions.canAssignResources,
                canSetGoals: permissions.canSetGoals,
              }}
            />
            <Separator />
            <SeasonStatistics player={player} />
            <ActiveGoals
              player={player}
              organizationSlug={organizationSlug}
              canSetGoals={permissions.canSetGoals}
            />
            <RecentNotes
              player={player}
              organizationSlug={organizationSlug}
              canCreateNotes={permissions.canCreateNotes}
            />
            <AssignedResources
              player={player}
              organizationSlug={organizationSlug}
            />

            <UpcomingEvents player={player} />
          </div>
        </PageContainer>
      </PageBody>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();
  const { activeTeam, teams } = Route.useRouteContext();
  const { player } = Route.useLoaderData();

  return (
    <PlayerHeader
      organizationSlug={organizationSlug}
      teamId={activeTeam.id}
      playerId={player.id}
    >
      <BreadcrumbItem>
        <BreadcrumbLink className="max-w-full truncate" title="Teams" asChild>
          <Link to="/$organizationSlug" params={{ organizationSlug }}>
            Teams
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbDropdown>
          <BreadcrumbLink asChild>
            <Link
              to="/$organizationSlug/$teamId"
              params={{ organizationSlug, teamId: activeTeam.id }}
            >
              {activeTeam.name}
            </Link>
          </BreadcrumbLink>
          <BreadcrumbDropdownTrigger />
          <BreadcrumbDropdownContent>
            <BreadcrumbDropdownLabel>Switch Team</BreadcrumbDropdownLabel>
            <BreadcrumbDropdownSeparator />
            {teams.map((team) => (
              <BreadcrumbDropdownItem asChild key={team.id}>
                <Link
                  to="/$organizationSlug/$teamId/players/$playerId"
                  params={{
                    organizationSlug,
                    teamId: team.id,
                    playerId: player.id,
                  }}
                >
                  {team.name}
                </Link>
              </BreadcrumbDropdownItem>
            ))}
          </BreadcrumbDropdownContent>
        </BreadcrumbDropdown>
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
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink title={player.name} asChild>
          <Link
            to="/$organizationSlug/$teamId/players/$playerId"
            params={{
              organizationSlug,
              teamId: activeTeam.id,
              playerId: player.id,
            }}
          >
            {player.name}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </PlayerHeader>
  );
}
