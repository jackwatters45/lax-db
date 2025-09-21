import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';
import { Calendar, MapPin, Plus, Trophy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for now - will replace with actual API calls
const mockGames = [
  {
    id: '1',
    opponentName: 'Riverside Hawks',
    gameDate: new Date('2024-09-25T15:00:00'),
    venue: 'Memorial Stadium',
    isHomeGame: true,
    gameType: 'regular' as const,
    status: 'scheduled' as const,
    homeScore: 0,
    awayScore: 0,
  },
  {
    id: '2',
    opponentName: 'Central Valley Eagles',
    gameDate: new Date('2024-09-18T18:30:00'),
    venue: 'Eagle Field',
    isHomeGame: false,
    gameType: 'regular' as const,
    status: 'completed' as const,
    homeScore: 8,
    awayScore: 12,
  },
  {
    id: '3',
    opponentName: 'North County Titans',
    gameDate: new Date('2024-10-02T16:00:00'),
    venue: 'Lions Field',
    isHomeGame: true,
    gameType: 'playoff' as const,
    status: 'scheduled' as const,
    homeScore: 0,
    awayScore: 0,
  },
];

// Server function for getting games (will implement proper API later)
const getTeamGames = createServerFn().handler(async () => {
  // TODO: Replace with actual API call
  // const { GamesAPI } = await import('@lax-db/core/games/index');
  // const request = getWebRequest();
  // return await GamesAPI.getTeamGames(teamId, request.headers);

  return mockGames;
});

// Server function for getting user permissions (simplified for now)
const getUserPermissions = createServerFn().handler(async () => {
  // TODO: Replace with actual permission check
  return {
    canManageGames: true, // Will check user role
    canEditGames: true,
    canViewStats: true,
  };
});

export const Route = createFileRoute('/_dashboard/games/')({
  component: GamesPage,
  loader: async () => {
    try {
      const [games, permissions] = await Promise.all([
        getTeamGames(),
        getUserPermissions(),
      ]);

      return { games, permissions };
    } catch (error) {
      console.error('Failed to load games:', error);
      return {
        games: mockGames,
        permissions: {
          canManageGames: true,
          canEditGames: true,
          canViewStats: true,
        },
      };
    }
  },
});

function GamesPage() {
  const { games, permissions } = Route.useLoaderData();

  const upcomingGames = games.filter(
    (game) =>
      game.status === 'scheduled' && new Date(game.gameDate) > new Date(),
  );

  const completedGames = games.filter((game) => game.status === 'completed');

  const nextGame = upcomingGames.sort(
    (a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime(),
  )[0];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Games</h1>
          <p className="text-muted-foreground">
            Manage your team's games and track performance
          </p>
        </div>

        {permissions.canManageGames && (
          <Button asChild>
            <Link to="/games/create">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Game
            </Link>
          </Button>
        )}
      </div>

      {/* Next Game Highlight */}
      {nextGame && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Next Game
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GameCard game={nextGame} permissions={permissions} isHighlighted />
          </CardContent>
        </Card>
      )}

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-xl">Upcoming Games</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingGames.map((game) => (
              <GameCard key={game.id} game={game} permissions={permissions} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Games */}
      {completedGames.length > 0 && (
        <div>
          <h2 className="mb-4 font-semibold text-xl">Recent Games</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedGames
              .sort(
                (a, b) =>
                  new Date(b.gameDate).getTime() -
                  new Date(a.gameDate).getTime(),
              )
              .slice(0, 6)
              .map((game) => (
                <GameCard key={game.id} game={game} permissions={permissions} />
              ))}
          </div>
        </div>
      )}

      {games.length === 0 && (
        <div className="py-12 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-semibold text-xl">No games scheduled</h2>
          <p className="mb-6 text-muted-foreground">
            Get started by scheduling your first game
          </p>
          {permissions.canManageGames && (
            <Button asChild>
              <Link to="/games/create">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Your First Game
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

type Game = {
  id: string;
  opponentName: string;
  gameDate: Date;
  venue: string;
  isHomeGame: boolean;
  gameType: 'regular' | 'playoff' | 'tournament' | 'friendly' | 'practice';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  homeScore: number;
  awayScore: number;
};

type Permissions = {
  canManageGames: boolean;
  canEditGames: boolean;
  canViewStats: boolean;
};

function GameCard({
  game,
  permissions,
  isHighlighted = false,
}: {
  game: Game;
  permissions: Permissions;
  isHighlighted?: boolean;
}) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: Game['status']) => {
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

  const getGameTypeLabel = (type: Game['gameType']) => {
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
    <Card
      className={`transition-shadow hover:shadow-md ${isHighlighted ? 'border-primary/50' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{game.opponentName}</CardTitle>
            <Badge variant={getStatusColor(game.status)}>
              {game.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <Badge variant="outline">{getGameTypeLabel(game.gameType)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date and Time */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(game.gameDate)}</span>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{game.venue}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {game.isHomeGame ? 'HOME' : 'AWAY'}
          </Badge>
        </div>

        {/* Score (if completed) */}
        {game.status === 'completed' && (
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center justify-between font-medium">
              <span>Final Score</span>
              <span className="font-bold">
                {game.isHomeGame
                  ? `${game.homeScore} - ${game.awayScore}`
                  : `${game.awayScore} - ${game.homeScore}`}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/games/${game.id}`}>View Details</Link>
          </Button>

          {permissions.canEditGames && game.status !== 'completed' && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/games/${game.id}/edit`}>Edit</Link>
            </Button>
          )}

          {permissions.canViewStats && game.status === 'completed' && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/games/${game.id}/stats`}>
                <Users className="mr-1 h-3 w-3" />
                Stats
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
