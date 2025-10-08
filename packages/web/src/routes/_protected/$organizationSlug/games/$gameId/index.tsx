import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Calendar, Edit, MapPin, Trophy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data - will replace with actual API calls
const mockGameDetails = {
  id: '1',
  opponentName: 'Riverside Hawks',
  gameDate: new Date('2024-09-25T15:00:00'),
  venue: 'Memorial Stadium',
  isHomeGame: true,
  gameType: 'regular' as const,
  status: 'scheduled' as
    | 'scheduled'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'postponed',
  homeScore: 0,
  awayScore: 0,
  weatherConditions: '',
  fieldConditions: '',
  coachNotes: 'Focus on ball control and transition defense.',
  roster: [
    {
      id: '1',
      name: 'John Smith',
      position: 'Attack',
      jerseyNumber: 10,
      isStarter: true,
    },
    {
      id: '2',
      name: 'Mike Johnson',
      position: 'Midfield',
      jerseyNumber: 23,
      isStarter: true,
    },
    {
      id: '3',
      name: 'David Wilson',
      position: 'Defense',
      jerseyNumber: 5,
      isStarter: true,
    },
    {
      id: '4',
      name: 'Chris Brown',
      position: 'Goalie',
      jerseyNumber: 1,
      isStarter: true,
    },
  ],
};

// Server function for getting game details
const getGameDetails = createServerFn({ method: 'GET' })
  .inputValidator((data: { gameId: string }) => data)
  .handler(async ({ data }) => {
    console.log('Getting game details for:', data.gameId);
    // TODO: Replace with actual API call
    // const { GamesAPI } = await import('@lax-db/core/games/index');
    // return await GamesAPI.getGame(data.gameId, headers);

    return mockGameDetails;
  });

// Server function for permissions
const getGamePermissions = createServerFn().handler(async () => {
  return {
    canEdit: true,
    canManageRoster: true,
    canViewStats: true,
  };
});

export const Route = createFileRoute(
  '/_protected/$organizationSlug/games/$gameId/',
)({
  component: GameDetailsPage,
  loader: async ({ params }) => {
    const [game, permissions] = await Promise.all([
      getGameDetails({ data: { gameId: params.gameId } }),
      getGamePermissions(),
    ]);

    return { game, permissions };
  },
});

function GameDetailsPage() {
  const { organizationSlug } = Route.useParams();
  const { game, permissions } = Route.useLoaderData();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'in_progress':
        return 'destructive';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      case 'postponed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getGameTypeLabel = (type: string) => {
    switch (type) {
      case 'regular':
        return 'Regular Season';
      case 'playoff':
        return 'Playoff';
      case 'tournament':
        return 'Tournament';
      case 'friendly':
        return 'Friendly';
      case 'practice':
        return 'Practice';
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link to="/$organizationSlug/games" params={{ organizationSlug }}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-3xl">{game.opponentName}</h1>
            <p className="text-muted-foreground">
              {getGameTypeLabel(game.gameType)} Game
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant={getStatusColor(game.status)}>
              {game.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {permissions.canEdit && game.status !== 'completed' && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/$organizationSlug/games/$gameId/edit"
                  params={{
                    organizationSlug,
                    gameId: game.id,
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Game
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Game Information */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Game Info */}
          <Card>
            <CardHeader>
              <CardTitle>Game Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(game.gameDate)}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{game.venue}</span>
                <Badge variant="outline" className="ml-auto">
                  {game.isHomeGame ? 'HOME' : 'AWAY'}
                </Badge>
              </div>

              {game.status === 'completed' && (
                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Final Score</span>
                    <span className="font-bold text-lg">
                      {game.isHomeGame
                        ? `${game.homeScore} - ${game.awayScore}`
                        : `${game.awayScore} - ${game.homeScore}`}
                    </span>
                  </div>
                </div>
              )}

              {game.coachNotes && (
                <div>
                  <h4 className="mb-2 font-medium">Coach Notes</h4>
                  <p className="text-muted-foreground text-sm">
                    {game.coachNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Roster */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Game Roster</CardTitle>
                {permissions.canManageRoster && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to="/$organizationSlug/games/$gameId/roster"
                      params={{
                        organizationSlug,
                        gameId: game.id,
                      }}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Roster
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {game.roster.length > 0 ? (
                <div className="space-y-2">
                  {game.roster.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
                          {player.jerseyNumber}
                        </div>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {player.position}
                          </div>
                        </div>
                      </div>
                      {player.isStarter && (
                        <Badge variant="secondary">Starter</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8" />
                  <p>No players added to roster yet</p>
                  {permissions.canManageRoster && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      asChild
                    >
                      <Link
                        to="/$organizationSlug/games/$gameId/roster"
                        params={{
                          organizationSlug,
                          gameId: game.id,
                        }}
                      >
                        Add Players
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.canManageRoster && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link
                    to="/$organizationSlug/games/$gameId/roster"
                    params={{
                      organizationSlug,
                      gameId: game.id,
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Roster
                  </Link>
                </Button>
              )}

              {permissions.canViewStats && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link
                    to="/$organizationSlug/games/$gameId/stats"
                    params={{
                      organizationSlug,
                      gameId: game.id,
                    }}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    {game.status === 'completed' ? 'View Stats' : 'Enter Stats'}
                  </Link>
                </Button>
              )}

              {permissions.canEdit && game.status !== 'completed' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link
                    to="/$organizationSlug/games/$gameId/edit"
                    params={{
                      organizationSlug,
                      gameId: game.id,
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Game
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Game Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Game Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant={getStatusColor(game.status)}>
                    {game.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Type</span>
                  <span className="text-sm">
                    {getGameTypeLabel(game.gameType)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Location</span>
                  <span className="text-sm">
                    {game.isHomeGame ? 'Home' : 'Away'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Players</span>
                  <span className="text-sm">{game.roster.length} added</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
