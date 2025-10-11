import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { OrganizationService } from '@lax-db/core/organization/index';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { TeamService } from '@lax-db/core/team/index';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { Team } from 'better-auth/plugins';
import { Effect, Schema as S } from 'effect';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
import { Textarea } from '@/components/ui/textarea';
import { authMiddleware } from '@/lib/middleware';

const UpdateTeamSchema = S.Struct({
  teamId: S.String,
  name: S.String,
  description: S.String.pipe(S.optional),
});

const updateTeam = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof UpdateTeamSchema.Type) =>
    S.decodeSync(UpdateTeamSchema)(data),
  )
  .handler(async ({ data, context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const teamService = yield* TeamService;
        return yield* teamService.updateTeam(data, context.headers);
      }),
    ),
  );

const getUserOrganizationContext = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const organiationService = yield* OrganizationService;
        return yield* organiationService.getUserOrganizationContext(
          context.headers,
        );
      }),
    ),
  );

const formSchema = S.Struct({
  name: S.String.pipe(
    S.minLength(1, { message: () => 'Team name is required' }),
    S.minLength(2, {
      message: () => 'Team name must be at least 2 characters',
    }),
    S.maxLength(100, {
      message: () => 'Team name must be less than 100 characters',
    }),
  ),
  description: S.optional(
    S.String.pipe(
      S.maxLength(500, {
        message: () => 'Description must be less than 500 characters',
      }),
    ),
  ),
});

type FormData = typeof formSchema.Type;

export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/setup',
)({
  component: SetupTeamPage,
  loader: async () => {
    const { teams } = await getUserOrganizationContext();
    return { teams };
  },
});

function SetupTeamPage() {
  const { organizationSlug, teamId } = Route.useParams();
  const { teams } = Route.useLoaderData();
  const router = useRouter();

  const team = teams.find((t: Team) => t.id === teamId);

  const form = useForm<FormData>({
    resolver: effectTsResolver(formSchema),
    defaultValues: {
      name: team?.name || '',
      description: '',
    },
  });

  const updateTeamMutation = useMutation({
    mutationKey: ['updateTeam', teamId],
    mutationFn: (data: FormData) => updateTeam({ data: { teamId, ...data } }),
    onSuccess: (_, variables) => {
      toast.success(`Team "${variables.name}" created successfully!`);
      router.invalidate();
      router.navigate({
        to: '/$organizationSlug',
        params: {
          organizationSlug,
        },
      });
    },
    onError: (error) => {
      toast.error('Failed to create team. Please try again.');
      console.error('Create team error:', error);
    },
  });

  const onSubmit = (data: FormData) => {
    updateTeamMutation.mutate(data);
  };

  if (!team) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <p>Team not found</p>
      </div>
    );
  }

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
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink title={team.name} asChild>
            <Link
              to="/$organizationSlug/$teamId"
              params={{ organizationSlug, teamId }}
            >
              {team.name}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink title="Setup" asChild>
            <Link
              to="/$organizationSlug/$teamId/setup"
              params={{ organizationSlug, teamId }}
            >
              Setup
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </DashboardHeader>
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="font-bold text-3xl">Create Your First Team</h1>
          <p className="text-muted-foreground">
            Give your team a unique name that reflects its identity
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., U18s, Senior Men's A, Women's Team"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the team..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link to="/$organizationSlug" params={{ organizationSlug }}>
                      Skip
                    </Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateTeamMutation.isPending}
                    className="flex-1"
                  >
                    {updateTeamMutation.isPending
                      ? 'Creating...'
                      : 'Create Team'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
