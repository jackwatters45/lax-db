import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      id: Math.random().toString(36).substring(2, 9),
      ...data,
      status: 'scheduled' as const,
      homeScore: 0,
      awayScore: 0,
    };
  });

// Form schema
const createGameSchema = z.object({
  opponentName: z.string().min(1, 'Opponent name is required'),
  gameDate: z.string().min(1, 'Date and time is required'),
  venue: z.string().min(1, 'Venue is required'),
  isHomeGame: z.boolean(),
  gameType: z.enum([
    'regular',
    'playoff',
    'tournament',
    'friendly',
    'practice',
  ]),
});

type CreateGameInput = z.infer<typeof createGameSchema>;

// Helper function to format datetime for input
const formatDateTimeForInput = () => {
  // Set default to next Saturday at 2 PM
  const nextSaturday = new Date();
  nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay()));
  nextSaturday.setHours(14, 0, 0, 0);
  return nextSaturday.toISOString().slice(0, 16);
};

export const Route = createFileRoute(
  '/_protected/$organizationSlug/games/create',
)({
  component: CreateGamePage,
});

function CreateGamePage() {
  const { organizationSlug } = Route.useParams();

  const router = useRouter();

  const form = useForm<CreateGameInput>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      opponentName: '',
      gameDate: formatDateTimeForInput(),
      venue: '',
      isHomeGame: true,
      gameType: 'regular',
    },
  });

  const createGameMutation = useMutation({
    mutationKey: ['createGame'],
    mutationFn: (data: CreateGameInput) => createGame({ data }),
    onSuccess: (game) => {
      toast.success(
        `Game against ${game.opponentName} scheduled successfully!`,
      );
      router.invalidate();
      router.navigate({
        to: '/$organizationSlug/games',
        params: { organizationSlug },
      });
    },
    onError: (error) => {
      toast.error('Failed to schedule game. Please try again.');
      console.error('Create game error:', error);
    },
  });

  const onSubmit = async (values: CreateGameInput) => {
    createGameMutation.mutate(values);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <Link to="/$organizationSlug/games" params={{ organizationSlug }}>
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="opponentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent Team *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Riverside Hawks, Central Valley Eagles"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gameDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Calendar className="mr-1 inline h-4 w-4" />
                      Date & Time *
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <MapPin className="mr-1 inline h-4 w-4" />
                      Venue *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Memorial Stadium, Lions Field"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isHomeGame"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Game Location</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) =>
                          field.onChange(value === 'true')
                        }
                        value={field.value ? 'true' : 'false'}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="home" />
                          <label htmlFor="home">Home Game</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="away" />
                          <label htmlFor="away">Away Game</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gameType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select game type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular Season</SelectItem>
                        <SelectItem value="playoff">Playoff</SelectItem>
                        <SelectItem value="tournament">Tournament</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="practice">Practice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.navigate({
                      to: '/$organizationSlug/games',
                      params: { organizationSlug },
                    })
                  }
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    form.formState.isSubmitting || createGameMutation.isPending
                  }
                  className="flex-1"
                >
                  {createGameMutation.isPending
                    ? 'Scheduling...'
                    : 'Schedule Game'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
