import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Server function for getting dashboard data
const getDashboardData = createServerFn().handler(async () => {
  const { TeamsAPI } = await import('@lax-db/core/teams/index');
  return await TeamsAPI.getDashboardData();
});

export const Route = createFileRoute('/_dashboard/teams/')({
  component: TeamsOverviewPage,
  loader: async () => {
    return await getDashboardData();
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
            <div key={team.id}>Team: {team.name}</div>
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

// function TeamOverviewCard({
//   team,
//   canManage,
// }: {
//   team: Team;
//   canManage: boolean;
// }) {
//   // Use React Query for team members
//   const { data: members = [], isLoading } = useQuery({
//     queryKey: ['teamMembers', team.id],
//     queryFn: () => TeamsAPI.getTeamMembers({ teamId: team.id }),
//     staleTime: 1000 * 60 * 5, // 5 minutes
//   });

//   const memberCount = members.length;

//   const handleDeleteTeam = async () => {
//     if (
//       !confirm(
//         `Are you sure you want to delete ${team.name}? This cannot be undone.`,
//       )
//     ) {
//       return;
//     }

//     try {
//       await TeamsAPI.deleteTeam({
//         teamId: team.id,
//       });

//       toast.success(`Team "${team.name}" deleted successfully.`);
//       window.location.reload(); // Simple refresh for now
//     } catch (error) {
//       toast.error(`Failed to delete team. Please try again. ${error}`);
//     }
//   };

//   return (
//     <Card className="hover:shadow-md transition-shadow">
//       <CardHeader className="pb-3">
//         <div className="flex items-center justify-between">
//           <CardTitle className="text-lg">{team.name}</CardTitle>
//           {canManage && (
//             <div className="flex gap-2">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="text-destructive hover:text-destructive"
//                 onClick={handleDeleteTeam}
//               >
//                 <Trash2 className="w-4 h-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       </CardHeader>

//       <CardContent>
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center gap-2">
//             <Users className="w-4 h-4 text-muted-foreground" />
//             <span className="text-sm text-muted-foreground">
//               {isLoading ? 'Loading...' : `${memberCount} members`}
//             </span>
//           </div>

//           <Badge variant="secondary">Active</Badge>
//         </div>

//         <div className="space-y-2">
//           <Button variant="outline" className="w-full" size="sm">
//             Manage Team
//             <ArrowRight className="w-4 h-4 ml-2" />
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

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
