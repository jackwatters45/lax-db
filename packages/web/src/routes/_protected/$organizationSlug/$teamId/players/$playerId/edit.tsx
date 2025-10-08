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
import { PlayerHeader } from './-components/player-header';
import { mockPlayerDetails } from './-utils';

// Server function for getting player details
const getPlayerDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { playerId: string }) => data)
  .handler(async ({ data }) => {
    console.log('Getting player details for:', data.playerId);
    // TODO: Replace with actual API call
    // const { PlayerDevelopmentAPI } = await import('@lax-db/core/player-development/index');
    // return await PlayerDevelopmentAPI.getPlayerProfile(data.playerId, headers);

    return mockPlayerDetails;
  });

export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players/$playerId/edit',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const player = await getPlayerDetails({
      data: { playerId: params.playerId },
    });

    return { player };
  },
});

function RouteComponent() {
  return (
    <>
      <Header />
      <PageBody>
        <PageContainer>
          <div />
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
                  to="/$organizationSlug/$teamId/players/$playerId/edit"
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
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink title="Edit" asChild>
          <Link
            to="/$organizationSlug/$teamId/players/$playerId/edit"
            params={{
              organizationSlug,
              teamId: activeTeam.id,
              playerId: player.id,
            }}
          >
            Edit
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </PlayerHeader>
  );
}
