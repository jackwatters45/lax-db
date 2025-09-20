import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock server function for creating games
const createGame = createServerFn({ method: 'POST' })
  .validator((data: CreateGameInput) => data)
  .handler(async ({ data }) => {
    console.log('Creating game:', data);
    // TODO: Replace with actual API call
    // const { GamesAPI } = await import('@lax-db/core/games/index');
    // const request = getWebRequest();
    // return await GamesAPI.createGame(data, request.headers);

    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      status: 'scheduled' as const,
      homeScore: 0,
      awayScore: 0,
    };
  });

type CreateGameInput = {
  opponentName: string;
  gameDate: string;
  venue: string;
  isHomeGame: boolean;
  gameType: 'regular' | 'playoff' | 'tournament' | 'friendly' | 'practice';
};

export const Route = createFileRoute('/_dashboard/games/create')({
  component: CreateGamePage,
});

function CreateGamePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateGameInput>({
    opponentName: '',
    gameDate: '',
    venue: '',
    isHomeGame: true,
    gameType: 'regular',
  });

  const createGameMutation = useMutation({
    mutationKey: ['createGame'],
    mutationFn: (data: CreateGameInput) => createGame({ data }),
    onSuccess: (game) => {
      toast.success(
        `Game against ${game.opponentName} scheduled successfully!`,
      );
      router.invalidate();
      router.navigate({ to: '/games' });
    },
    onError: (error) => {
      toast.error('Failed to schedule game. Please try again.');
      console.error('Create game error:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.opponentName.trim() ||
      !formData.gameDate ||
      !formData.venue.trim()
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    createGameMutation.mutate(formData);
  };

  const handleInputChange = (
    field: keyof CreateGameInput,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDateTimeForInput = () => {
    // Set default to next Saturday at 2 PM
    const nextSaturday = new Date();
    nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay()));
    nextSaturday.setHours(14, 0, 0, 0);
    return nextSaturday.toISOString().slice(0, 16);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <Link to="/games">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Button>
        </Link>

        <h1 className="font-bold text-3xl">Schedule New Game</h1>
        <p className="text-muted-foreground">
          Add a new game to your team's schedule
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Opponent Name */}
            <div>
              <label
                htmlFor="opponentName"
                className="mb-2 block font-medium text-sm"
              >
                Opponent Team *
              </label>
              <input
                id="opponentName"
                type="text"
                value={formData.opponentName}
                onChange={(e) =>
                  handleInputChange('opponentName', e.target.value)
                }
                placeholder="e.g., Riverside Hawks, Central Valley Eagles"
                className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            {/* Game Date and Time */}
            <div>
              <label
                htmlFor="gameDate"
                className="mb-2 block font-medium text-sm"
              >
                <Calendar className="mr-1 inline h-4 w-4" />
                Date & Time *
              </label>
              <input
                id="gameDate"
                type="datetime-local"
                value={formData.gameDate || formatDateTimeForInput()}
                onChange={(e) => handleInputChange('gameDate', e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            {/* Venue */}
            <div>
              <label htmlFor="venue" className="mb-2 block font-medium text-sm">
                <MapPin className="mr-1 inline h-4 w-4" />
                Venue *
              </label>
              <input
                id="venue"
                type="text"
                value={formData.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                placeholder="e.g., Memorial Stadium, Lions Field"
                className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            {/* Home/Away */}
            <div>
              <label className="mb-3 block font-medium text-sm">
                Game Location
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    name="isHomeGame"
                    checked={formData.isHomeGame === true}
                    onChange={() => handleInputChange('isHomeGame', true)}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Home Game</span>
                </label>
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    name="isHomeGame"
                    checked={formData.isHomeGame === false}
                    onChange={() => handleInputChange('isHomeGame', false)}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Away Game</span>
                </label>
              </div>
            </div>

            {/* Game Type */}
            <div>
              <label
                htmlFor="gameType"
                className="mb-2 block font-medium text-sm"
              >
                Game Type
              </label>
              <select
                id="gameType"
                value={formData.gameType}
                onChange={(e) =>
                  handleInputChange(
                    'gameType',
                    e.target.value as CreateGameInput['gameType'],
                  )
                }
                className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="regular">Regular Season</option>
                <option value="playoff">Playoff</option>
                <option value="tournament">Tournament</option>
                <option value="friendly">Friendly</option>
                <option value="practice">Practice</option>
              </select>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.navigate({ to: '/games' })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createGameMutation.isPending}
                className="flex-1"
              >
                {createGameMutation.isPending
                  ? 'Scheduling...'
                  : 'Schedule Game'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
