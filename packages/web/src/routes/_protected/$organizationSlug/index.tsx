import {
  createFileRoute,
  Link,
  useRouteContext,
  useRouter,
} from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { Team, TeamMember } from 'better-auth/plugins';
import { ArrowRight, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authMiddleware } from '@/lib/middleware';

// Server function for getting user organization context
const getUserOrganizationContext = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { OrganizationAPI } = await import('@lax-db/core/organization/index');

    return await OrganizationAPI.getUserOrganizationContext(context.headers);
  });

// Server function for deleting teams
const deleteTeam = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { teamId: string }) => data)
  .handler(async ({ data, context }) => {
    const { TeamsAPI } = await import('@lax-db/core/teams/index');

    return await TeamsAPI.deleteTeam(data, context.headers);
  });

export const Route = createFileRoute('/_protected/$organizationSlug/')({
  component: TeamsOverviewPage,
  loader: async () => {
    return await getUserOrganizationContext();
  },
});

function TeamsOverviewPage() {
  const { organizationSlug } = Route.useParams();
  const { teams, canManageTeams } = Route.useLoaderData();
  const { activeOrganization } = useRouteContext({
    from: '/_protected/$organizationSlug',
  });

  return (
    <>
      <DashboardHeader>
        <BreadcrumbItem>
          <BreadcrumbLink title="Teams" asChild>
            <Link to="/$organizationSlug" params={{ organizationSlug }}>
              Teams
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </DashboardHeader>
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
              <Link
                to="/$organizationSlug/teams/create"
                params={{ organizationSlug }}
              >
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
                <Link
                  to="/organizations/create/$organizationSlug"
                  params={{ organizationSlug }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Team
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function TeamOverviewCard({
  team,
  canManage,
}: {
  team: Team & { members: TeamMember[] };
  canManage: boolean;
}) {
  const { organizationSlug } = Route.useParams();

  const router = useRouter();
  const memberCount = team.members.length;

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam({
        data: { teamId: team.id },
      });

      toast.success(`Team "${team.name}" deleted successfully.`);
      router.invalidate(); // Refresh the route data
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Team</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{team.name}"? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteTeam}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              {memberCount} members
            </span>
          </div>

          <Badge variant="secondary">Active</Badge>
        </div>

        <div className="space-y-2">
          <Link
            to="/$organizationSlug/$teamId"
            params={{
              organizationSlug,
              teamId: team.id,
            }}
          >
            <Button variant="outline" className="w-full" size="sm">
              Manage Team
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
