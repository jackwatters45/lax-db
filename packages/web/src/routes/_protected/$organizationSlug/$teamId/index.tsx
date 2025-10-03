import { TeamIdSchema } from '@lax-db/core/player/player.schema';
import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
import { Mail, Plus, Settings, UserMinus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageBody } from '@/components/layout/page-content';
import { Badge } from '@/components/ui/badge';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';
import { authMiddleware } from '@/lib/middleware';
import { TeamHeader } from './-components/team-header';

const GetTeamDataSchema = S.Struct({
  teamId: TeamIdSchema,
});

const getTeamData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: typeof GetTeamDataSchema.Type) =>
    S.decodeSync(GetTeamDataSchema)(data),
  )
  .handler(async ({ data: { teamId }, context }) => {
    const { auth } = await import('@lax-db/core/auth');

    try {
      // Get team members and active member role
      const [membersResult, activeMemberResult] = await Promise.all([
        auth.api.listTeamMembers({
          query: { teamId },
          headers: context.headers,
        }),
        auth.api.getActiveMember({
          headers: context.headers,
        }),
      ]);

      const members = membersResult || [];
      const activeMember = activeMemberResult || null;
      const canManageTeam =
        activeMember?.role === 'coach' || activeMember?.role === 'headCoach';

      return {
        teamId,
        members,
        activeMember,
        canManageTeam,
      };
    } catch (error) {
      console.error('Error loading team data:', error);
      return {
        teamId,
        members: [],
        activeMember: null,
        canManageTeam: false,
      };
    }
  });

export const Route = createFileRoute('/_protected/$organizationSlug/$teamId/')({
  component: TeamManagementPage,
  loader: async ({ params }) => {
    return await getTeamData({ data: { teamId: params.teamId } });
  },
});

function TeamManagementPage() {
  const { organizationSlug } = Route.useParams();
  const { activeTeam } = Route.useRouteContext();
  const { teamId, members, canManageTeam } = Route.useLoaderData();
  const [teamName, setTeamName] = useState<string>('');
  const [invitePlayerOpen, setInvitePlayerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load team details
    const loadTeamDetails = async () => {
      try {
        // For now, we'll need to get team name from the teams list
        // In a real app, you'd have a getTeam(teamId) API
        const teamsResult = await authClient.organization.listTeams();
        const team = teamsResult.data?.find((t) => t.id === teamId);
        setTeamName(team?.name || 'Unknown Team');
      } catch (error) {
        console.error('Error loading team details:', error);
        setTeamName('Unknown Team');
      } finally {
        setLoading(false);
      }
    };

    loadTeamDetails();
  }, [teamId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Loading team details...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <PageBody>
        <div className="container mx-auto py-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex-1">
              <h1 className="font-bold text-3xl">{teamName}</h1>
              <p className="text-muted-foreground">
                Manage players and team settings
              </p>
            </div>

            {canManageTeam && (
              <div className="flex gap-2">
                <Button onClick={() => setInvitePlayerOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Player
                </Button>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Team Settings
                </Button>
              </div>
            )}
          </div>

          {/* Team Stats */}
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{members.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium text-sm">
                  Active Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{members.length}</div>
                <p className="text-muted-foreground text-xs">
                  All players active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium text-sm">
                  Team Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Active</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Team Roster */}
          <Card>
            <CardHeader>
              <CardTitle>Team Roster</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="space-y-4">
                  {members.map((member) => (
                    <TeamMemberCard
                      key={member.id}
                      member={member}
                      canManage={canManageTeam}
                      teamId={teamId}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-4 text-muted-foreground">
                    No players in this team yet
                  </div>
                  {canManageTeam && (
                    <Button onClick={() => setInvitePlayerOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Invite Your First Player
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite Player Dialog */}
          {invitePlayerOpen && (
            <InvitePlayerDialog
              open={invitePlayerOpen}
              onClose={() => setInvitePlayerOpen(false)}
              teamId={teamId}
            />
          )}
        </div>
      </PageBody>
    </>
  );
}

function TeamMemberCard({
  member,
  canManage,
  teamId,
}: {
  member: any;
  canManage: boolean;
  teamId: string;
}) {
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    // In a real app, you'd have an API to get user details by ID
    // For now, we'll use what's available in the member object
    setUserDetails({
      name: member.user?.name || 'Unknown Player',
      email: member.user?.email || '',
      image: member.user?.image,
    });
  }, [member]);

  const handleRemoveFromTeam = async () => {
    if (
      !confirm('Are you sure you want to remove this player from the team?')
    ) {
      return;
    }

    try {
      const { error } = await authClient.organization.removeTeamMember({
        teamId,
        userId: member.userId,
      });

      if (!error) {
        window.location.reload(); // Simple refresh for now
      } else {
        alert('Failed to remove player. Please try again.');
      }
    } catch (_error) {
      alert('Failed to remove player. Please try again.');
    }
  };

  if (!userDetails) {
    return (
      <div className="rounded-lg border p-4">Loading player details...</div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          {userDetails.image ? (
            <img
              src={userDetails.image}
              alt={userDetails.name}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <span className="font-semibold">
              {userDetails.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <div className="font-medium">{userDetails.name}</div>
          <div className="text-muted-foreground text-sm">
            {userDetails.email}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">Player</Badge>

        {canManage && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              <Mail className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleRemoveFromTeam}
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function InvitePlayerDialog({
  open,
  onClose,
  teamId,
}: {
  open: boolean;
  onClose: () => void;
  teamId: string;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvitePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await authClient.organization.inviteMember({
        email: email.trim(),
        role: 'player',
        teamId,
      });

      if (!error) {
        setEmail('');
        onClose();
        alert('Invitation sent successfully!');
      } else {
        alert('Failed to send invitation. Please try again.');
      }
    } catch (_error) {
      alert('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6">
        <h2 className="mb-4 font-semibold text-xl">Invite Player to Team</h2>

        <form onSubmit={handleInvitePlayer} className="space-y-4">
          <div>
            <label
              htmlFor="playerEmail"
              className="mb-2 block font-medium text-sm"
            >
              Player Email
            </label>
            <input
              id="playerEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@example.com"
              className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <p className="mt-1 text-muted-foreground text-xs">
              They will receive an email invitation to join this team
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Header() {
  const { organizationSlug, teamId } = Route.useParams();
  const { activeTeam, teams } = Route.useRouteContext();

  return (
    <TeamHeader organizationSlug={organizationSlug} teamId={teamId}>
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
                  to="/$organizationSlug/$teamId"
                  params={{
                    organizationSlug,
                    teamId: team.id,
                  }}
                >
                  {team.name}
                </Link>
              </BreadcrumbDropdownItem>
            ))}
          </BreadcrumbDropdownContent>
        </BreadcrumbDropdown>
      </BreadcrumbItem>
    </TeamHeader>
  );
}
