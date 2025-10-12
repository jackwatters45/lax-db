import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import {
  CreateGameInput,
  GameService,
  GetAllGamesInput,
} from '@lax-db/core/game/index';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema } from 'effect';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/page-content';
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
import { authMiddleware } from '@/lib/middleware';

const ORG_ID = 'YRGXnzwJrEam1sK8ZzJUErm1cFIB2V9W';
const getAllGames = createServerFn({ method: 'GET' })
  .inputValidator((data: GetAllGamesInput) =>
    Schema.decodeSync(GetAllGamesInput)(data),
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const gameService = yield* GameService;
        return yield* gameService.getAll(data);
      }),
    ),
  );

export const Route = createFileRoute('/test')({
  component: RouteComponent,
  // ssr: 'data-only',
  loader: async () =>
    getAllGames({
      data: {
        organizationId: ORG_ID,
        teamId: null,
      },
    }),
});

// TODO: commits
// TODO: add ability
function RouteComponent() {
  const data = Route.useLoaderData();

  return (
    <div>
      <section>
        <div>Results</div>
        <div>{JSON.stringify(data, null, 4)}</div>
      </section>
      <CreateOrganizationForm organizationId={ORG_ID} />
      <section />
    </div>
  );
}

const createGame = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof CreateGameInput.Type) =>
    Schema.decodeSync(CreateGameInput)(data),
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const gameService = yield* GameService;
        return yield* gameService.create(data);
      }),
    ),
  );

type FormData = typeof CreateGameInput.Type;

export function CreateOrganizationForm({
  organizationSlug,
  organizationId,
}: {
  organizationSlug?: string;
  organizationId: string;
}) {
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: effectTsResolver(CreateGameInput),
    defaultValues: {
      organizationId: organizationId,
    },
  });

  const createGameMutation = useMutation({
    mutationFn: (data: FormData) => createGame({ data }),
    onSuccess: async (_result, _variables) => {
      await router.invalidate();
    },
    onError: (_error, _variables) => {
      toast.error('Failed to create game. Please try again.');
    },
  });

  const onSubmit = (data: FormData) => {
    createGameMutation.mutate(data);
  };

  return (
    <PageContainer className="space-y-4">
      <div>
        <h1 className="font-bold text-xl">Create Your Athletic Club</h1>
        <p className="text-muted-foreground">
          Set up your organization to start managing teams and players
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="opponentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Malvern Lacrosse Club"
                        {...field}
                        onChange={(e) => field.onChange(e)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={createGameMutation.isPending}>
                  {createGameMutation.isPending ? 'Creating...' : 'Create Game'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
