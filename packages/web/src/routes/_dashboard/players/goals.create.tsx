import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Calendar, Target } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Form schema
const goalFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  category: z.enum(['skill', 'academic', 'team', 'personal']),
  currentValue: z.string().optional(),
  targetValue: z.string().min(1, 'Target value is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['low', 'medium', 'high']),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

// Server function to create a goal
const createPlayerGoal = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      playerId: string;
      title: string;
      description?: string;
      category: string;
      targetValue: string;
      currentValue?: string;
      dueDate: string;
      priority: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    console.log('Creating goal:', data);
    // TODO: Replace with actual API call
    // const { PlayerDevelopmentAPI } = await import('@lax-db/core/player-development/index');
    // return await PlayerDevelopmentAPI.createGoal(data, headers);

    return { success: true, goalId: 'goal-123' };
  });

// Server function to get player info
const getPlayerInfo = createServerFn({ method: 'GET' })
  .validator((data: { playerId: string }) => data)
  .handler(async ({ data }) => {
    console.log('Getting player info for:', data.playerId);
    // TODO: Replace with actual API call
    return {
      id: data.playerId,
      name: 'Alex Johnson',
      position: 'attack',
      gradeLevel: 'junior',
    };
  });

export const Route = createFileRoute('/_dashboard/players/goals/create')({
  component: CreateGoalPage,
  validateSearch: (search: Record<string, unknown>) => ({
    playerId: search.playerId as string,
  }),
  loaderDeps: ({ search }) => ({ playerId: search.playerId }),
  loader: async ({ deps }) => {
    if (!deps.playerId) {
      throw new Error('Player ID is required');
    }

    const player = await getPlayerInfo({ data: { playerId: deps.playerId } });
    return { player };
  },
});

function CreateGoalPage() {
  const { playerId } = Route.useSearch();
  const { player } = Route.useLoaderData();
  const router = useRouter();

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'skill',
      currentValue: '',
      targetValue: '',
      dueDate: '',
      priority: 'medium',
    },
  });

  const onSubmit = async (values: GoalFormValues) => {
    try {
      await createPlayerGoal({
        data: {
          playerId,
          ...values,
        },
      });

      // Navigate back to player page
      router.navigate({
        to: '/players/$playerId',
        params: { playerId },
      });
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const categories = [
    { value: 'skill', label: 'Skill Development', icon: '🎯' },
    { value: 'academic', label: 'Academic', icon: '📚' },
    { value: 'team', label: 'Team Performance', icon: '🏆' },
    { value: 'personal', label: 'Personal Development', icon: '🌟' },
  ] as const;

  const priorities = [
    { value: 'low', label: 'Low', color: 'secondary' },
    { value: 'medium', label: 'Medium', color: 'default' },
    { value: 'high', label: 'High', color: 'destructive' },
  ] as const;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <Link to={'/players/$playerId'} params={{ playerId }}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {player.name}
          </Button>
        </Link>

        <div>
          <h1 className="font-bold text-3xl">Set New Goal</h1>
          <p className="text-muted-foreground">
            Create a development goal for {player.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Improve Shot Accuracy"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the goal and what success looks like..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Provide more details about this goal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <button
                            key={category.value}
                            type="button"
                            onClick={() => field.onChange(category.value)}
                            className={`flex items-center gap-2 rounded-md border p-3 text-left transition-colors ${
                              field.value === category.value
                                ? 'border-primary bg-primary/5'
                                : 'border-input hover:bg-muted'
                            }`}
                          >
                            <span className="text-lg">{category.icon}</span>
                            <span className="font-medium text-sm">
                              {category.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target and Current Values */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Value</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 60% accuracy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 75% accuracy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        {priorities.map((priority) => (
                          <button
                            key={priority.value}
                            type="button"
                            onClick={() => field.onChange(priority.value)}
                            className={`flex-1 rounded-md border p-2 text-center transition-colors ${
                              field.value === priority.value
                                ? 'border-primary bg-primary/5'
                                : 'border-input hover:bg-muted'
                            }`}
                          >
                            <Badge variant={priority.color} className="w-full">
                              {priority.label}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  asChild
                >
                  <Link to={'/players/$playerId'} params={{ playerId }}>
                    Cancel
                  </Link>
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
