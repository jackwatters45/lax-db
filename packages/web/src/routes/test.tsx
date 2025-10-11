import { GetGameInputSchema } from '@lax-db/core/game/game.schema';
import { GameService } from '@lax-db/core/game/index';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema as S } from 'effect';

const getAllGames = createServerFn({ method: 'GET' })
  .inputValidator((data: GetGameInputSchema) =>
    S.decodeSync(GetGameInputSchema)(data),
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const gameService = yield* GameService;
        return yield* gameService.get(data);
      }),
    ),
  );

export const Route = createFileRoute('/test')({
  component: RouteComponent,
  loader: async () => getAllGames({ data: { publicId: 'lex6nbE9_Vwx' } }),
});

function RouteComponent() {
  const data = Route.useLoaderData();

  return <div>{JSON.stringify(data, null, 4)}</div>;
}
