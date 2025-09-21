import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Plus, Save, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

// Mock data
const mockTeamPlayers = [
  { id: '1', name: 'John Smith', position: 'Attack', jerseyNumber: 10 },
  { id: '2', name: 'Mike Johnson', position: 'Midfield', jerseyNumber: 23 },
  { id: '3', name: 'David Wilson', position: 'Defense', jerseyNumber: 5 },
  { id: '4', name: 'Chris Brown', position: 'Goalie', jerseyNumber: 1 },
  { id: '5', name: 'Alex Garcia', position: 'Attack', jerseyNumber: 15 },
  { id: '6', name: 'Ryan Davis', position: 'Defense', jerseyNumber: 8 },
  { id: '7', name: 'Tyler Martinez', position: 'Midfield', jerseyNumber: 12 },
  { id: '8', name: 'Kevin Lee', position: 'Attack', jerseyNumber: 3 },
];

const mockGameRoster = [
  { playerId: '1', isStarter: true, isCaptain: false },
  { playerId: '2', isStarter: true, isCaptain: true },
  { playerId: '3', isStarter: true, isCaptain: false },
  { playerId: '4', isStarter: true, isCaptain: false },
];

// Server functions
const getGameRoster = createServerFn({ method: 'GET' })
  .validator((data: { gameId: string }) => data)
  .handler(async ({ data }) => {
    console.log('Getting roster for game:', data.gameId);
    // TODO: Replace with actual API
    return mockGameRoster;
  });

const getTeamPlayers = createServerFn().handler(async () => {
  // TODO: Replace with actual API
  return mockTeamPlayers;
});

const updateGameRoster = createServerFn({ method: 'POST' })
  .validator((data: { gameId: string; roster: RosterPlayer[] }) => data)
  .handler(async ({ data }) => {
    console.log('Updating roster:', data);
    // TODO: Replace with actual API
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  });

type RosterPlayer = {
  playerId: string;
  isStarter: boolean;
  isCaptain: boolean;
};

export const Route = createFileRoute('/_dashboard/games/$gameId/roster')({
  component: RosterManagementPage,
  loader: async ({ params }) => {
    const [roster, players] = await Promise.all([
      getGameRoster({ data: { gameId: params.gameId } }),
      getTeamPlayers(),
    ]);

    return { roster, players, gameId: params.gameId };
  },
});

function RosterManagementPage() {
  const { roster: initialRoster, players, gameId } = Route.useLoaderData();
  const router = useRouter();
  const [roster, setRoster] = useState<RosterPlayer[]>(initialRoster);

  const updateRosterMutation = useMutation({
    mutationKey: ['updateRoster', gameId],
    mutationFn: (newRoster: RosterPlayer[]) =>
      updateGameRoster({ data: { gameId, roster: newRoster } }),
    onSuccess: () => {
      toast.success('Roster updated successfully!');
      router.invalidate();
    },
    onError: () => {
      toast.error('Failed to update roster. Please try again.');
    },
  });

  const isPlayerInRoster = (playerId: string) => {
    return roster.some((r) => r.playerId === playerId);
  };

  const _getPlayerRosterInfo = (playerId: string) => {
    return roster.find((r) => r.playerId === playerId);
  };

  const addPlayerToRoster = (playerId: string) => {
    if (!isPlayerInRoster(playerId)) {
      setRoster((prev) => [
        ...prev,
        {
          playerId,
          isStarter: false,
          isCaptain: false,
        },
      ]);
    }
  };

  const removePlayerFromRoster = (playerId: string) => {
    setRoster((prev) => prev.filter((r) => r.playerId !== playerId));
  };

  const updatePlayerRosterInfo = (
    playerId: string,
    updates: Partial<RosterPlayer>,
  ) => {
    setRoster((prev) =>
      prev.map((r) => (r.playerId === playerId ? { ...r, ...updates } : r)),
    );
  };

  const handleSave = () => {
    updateRosterMutation.mutate(roster);
  };

  const rosterPlayers = roster
    .map((r) => {
      const player = players.find((p) => p.id === r.playerId);
      return player ? { ...player, ...r } : null;
    })
    .filter((player): player is NonNullable<typeof player> => player !== null);

  const availablePlayers = players.filter((p) => !isPlayerInRoster(p.id));

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link to="/games/$gameId" params={{ gameId }}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Game
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Manage Game Roster</h1>
            <p className="text-muted-foreground">
              Add players and set starting lineup
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateRosterMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateRosterMutation.isPending ? 'Saving...' : 'Save Roster'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Roster */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Game Roster ({roster.length} players)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rosterPlayers.length > 0 ? (
              <div className="space-y-3">
                {rosterPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                        {player.jerseyNumber}
                      </div>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-muted-foreground text-sm">
                          {player.position}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Checkbox
                            id={`starter-${player.id}`}
                            checked={player.isStarter}
                            onCheckedChange={(checked) =>
                              updatePlayerRosterInfo(player.id, {
                                isStarter: checked === true,
                              })
                            }
                          />
                          <label htmlFor={`starter-${player.id}`}>
                            Starter
                          </label>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Checkbox
                            id={`captain-${player.id}`}
                            checked={player.isCaptain}
                            onCheckedChange={(checked) =>
                              updatePlayerRosterInfo(player.id, {
                                isCaptain: checked === true,
                              })
                            }
                          />
                          <label htmlFor={`captain-${player.id}`}>
                            Captain
                          </label>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayerFromRoster(player.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-2 h-8 w-8" />
                <p>No players added to roster yet</p>
                <p className="text-sm">Add players from the available list</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Available Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availablePlayers.length > 0 ? (
              <div className="space-y-2">
                {availablePlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-sm">
                        {player.jerseyNumber}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{player.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {player.position}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addPlayerToRoster(player.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-2 h-8 w-8" />
                <p>All players have been added to the roster</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Roster Summary */}
      {roster.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Roster Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="font-bold text-2xl">{roster.length}</div>
                <div className="text-muted-foreground text-sm">
                  Total Players
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl">
                  {roster.filter((r) => r.isStarter).length}
                </div>
                <div className="text-muted-foreground text-sm">Starters</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl">
                  {roster.filter((r) => r.isCaptain).length}
                </div>
                <div className="text-muted-foreground text-sm">Captains</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl">
                  {roster.length - roster.filter((r) => r.isStarter).length}
                </div>
                <div className="text-muted-foreground text-sm">
                  Bench Players
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
