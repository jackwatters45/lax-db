import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { PageBody, PageContainer } from '@/components/layout/page-content';
import { TeamBreadcrumbSwitcher } from '@/components/nav/team-breadcrumb-switcher';
import {
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
  PlayerOverview,
  QuickActions,
  RecentNotes,
  SeasonStatistics,
  UpcomingEvents,
} from './-old-components';
import { mockPlayerDetails } from './-utils';

// Server function for getting player details
const getPlayerDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { playerId: string }) => data)
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call
    // const { PlayerDevelopmentAPI } = await import('@lax-db/core/player-development/index');
    // return await PlayerDevelopmentAPI.getPlayerProfile(data.playerId, headers);

    return mockPlayerDetails;
  });

const getPlayerPermissions = createServerFn().handler(async () => ({
  canEdit: true,
  canCreateNotes: true,
  canAssess: true,
  canAssignResources: true,
  canSetGoals: true,
  canViewSensitive: true,
}));

export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players/$playerId/'
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
            canEdit={permissions.canEdit}
            organizationSlug={organizationSlug}
            playerInfo={playerInfo}
            teamId={teamId}
          />
          <div className="space-y-4">
            {/*{permissions.canViewSensitive && (
              <ContactInfo contactInfo={contactInfo} />
            )}*/}
            <PlayerOverview player={player} />
            <QuickActions
              organizationSlug={organizationSlug}
              permissions={{
                canCreateNotes: permissions.canCreateNotes,
                canAssess: permissions.canAssess,
                canAssignResources: permissions.canAssignResources,
                canSetGoals: permissions.canSetGoals,
              }}
              playerId={player.id}
            />
            <Separator />
            <SeasonStatistics player={player} />
            <ActiveGoals
              canSetGoals={permissions.canSetGoals}
              organizationSlug={organizationSlug}
              player={player}
            />
            <RecentNotes
              canCreateNotes={permissions.canCreateNotes}
              organizationSlug={organizationSlug}
              player={player}
            />
            <AssignedResources
              organizationSlug={organizationSlug}
              player={player}
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
      playerId={player.id}
      teamId={activeTeam.id}
    >
      <BreadcrumbItem>
        <BreadcrumbLink asChild className="max-w-full truncate" title="Teams">
          <Link params={{ organizationSlug }} to="/$organizationSlug">
            Teams
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <TeamBreadcrumbSwitcher
        activeTeam={activeTeam}
        organizationSlug={organizationSlug}
        teams={teams}
      >
        {({ team }) => (
          <Link
            params={{
              organizationSlug,
              teamId: team.id,
              playerId: player.id,
            }}
            to="/$organizationSlug/$teamId/players/$playerId"
          >
            {team.name}
          </Link>
        )}
      </TeamBreadcrumbSwitcher>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild title="Players">
          <Link
            params={{ organizationSlug, teamId: activeTeam.id }}
            to="/$organizationSlug/$teamId/players"
          >
            Players
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild title={player.name}>
          <Link
            params={{
              organizationSlug,
              teamId: activeTeam.id,
              playerId: player.id,
            }}
            to="/$organizationSlug/$teamId/players/$playerId"
          >
            {player.name}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </PlayerHeader>
  );
}
