import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';
import type { Team } from 'better-auth/plugins';
import { ArrowRight, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Server function for getting user organization context
const getUserOrganizationContext = createServerFn().handler(async () => {
  const { TeamsAPI } = await import('@lax-db/core/teams/index');

  const request = getWebRequest();
  return await TeamsAPI.getUserOrganizationContext(request.headers);
});

// Server function for getting team members
const getTeamMembers = createServerFn({ method: 'GET' })
  .validator((data: { teamId: string }) => data)
  .handler(async ({ data }) => {
    const { TeamsAPI } = await import('@lax-db/core/teams/index');
    const { getWebRequest } = await import('@tanstack/react-start/server');

    const request = getWebRequest();
    return await TeamsAPI.getTeamMembers(data, request.headers);
  });

// Server function for deleting teams
const deleteTeam = createServerFn({ method: 'POST' })
  .validator((data: { teamId: string }) => data)
  .handler(async ({ data }) => {
    const { TeamsAPI } = await import('@lax-db/core/teams/index');
    const { getWebRequest } = await import('@tanstack/react-start/server');

    const request = getWebRequest();
    return await TeamsAPI.deleteTeam(data, request.headers);
  });

export const Route = createFileRoute('/_dashboard/teams/')({
  component: TeamsOverviewPage,
  loader: async () => {
    return await getUserOrganizationContext();
  },
});

function TeamsOverviewPage() {
  const { activeOrganization, teams, canManageTeams } = Route.useLoaderData();

  if (!activeOrganization) {
    return <NoOrganizationPrompt />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams for {activeOrganization.name}
          </p>
        </div>

        {canManageTeams && (
          <Button asChild>
            <Link to="/teams/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Link>
          </Button>
        )}
      </div>

      {teams && teams.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamOverviewCard
              key={team.id}
              team={team}
              canManage={canManageTeams}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-semibold text-xl">No teams yet</h2>
          <p className="mb-6 text-muted-foreground">
            Get started by creating your first team
          </p>
          {canManageTeams && (
            <Button asChild>
              <Link to="/teams/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Team
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function TeamOverviewCard({
  team,
  canManage,
}: {
  team: Team;
  canManage: boolean;
}) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['teamMembers', team.id],
    queryFn: () => getTeamMembers({ data: { teamId: team.id } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const memberCount = members.length;

  const handleDeleteTeam = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${team.name}? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteTeam({
        data: { teamId: team.id },
      });

      toast.success(`Team "${team.name}" deleted successfully.`);
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      toast.error(`Failed to delete team. Please try again. ${error}`);
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{team.name}</CardTitle>
          {canManage && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDeleteTeam}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              {isLoading ? 'Loading...' : `${memberCount} members`}
            </span>
          </div>

          <Badge variant="secondary">Active</Badge>
        </div>

        <div className="space-y-2">
          <Button variant="outline" className="w-full" size="sm">
            Manage Team
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NoOrganizationPrompt() {
  return (
    <div className="container mx-auto py-8 text-center">
      <div className="mx-auto max-w-md">
        <Users className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-4 font-bold text-2xl">Welcome to LaxDB</h1>
        <p className="mb-8 text-muted-foreground">
          You need to create or join an athletic club to get started with team
          management.
        </p>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/organizations/create">Create New Athletic Club</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/organizations/join">Join Existing Club</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
