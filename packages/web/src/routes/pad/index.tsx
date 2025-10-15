import { GetAllGamesInput } from '@lax-db/core/game/game.schema';
import { GameService } from '@lax-db/core/game/game.service';
import { RpcGameClient } from '@lax-db/core/rpc/client';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { GetAllSeasonsInput } from '@lax-db/core/season/season.schema';
import { SeasonService } from '@lax-db/core/season/season.service';
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema } from 'effect';
import { CreateGameForm } from './-create-game-form';
import { CreateSeasonForm } from './-create-season-form';

const ORG_ID = 'YRGXnzwJrEam1sK8ZzJUErm1cFIB2V9W';
const TEAM_ID = 'zMdIMZuQEfe0ec3lsK6a8YhwHysRcvq5';

const getAllSeasons = createServerFn({ method: 'GET' })
  .inputValidator((data: GetAllSeasonsInput) =>
    Schema.decodeSync(GetAllSeasonsInput)(data)
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const seasonService = yield* SeasonService;
        return yield* seasonService.getAll(data);
      })
    )
  );

const getAllGames = createServerFn({ method: 'GET' })
  .inputValidator((data: GetAllGamesInput) =>
    Schema.decodeSync(GetAllGamesInput)(data)
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const gameService = yield* GameService;
        return yield* gameService.getAll(data);
      })
    )
  );

export const Route = createFileRoute('/pad/')({
  component: RouteComponent,
  loader: async () => {
    const seasons = await getAllSeasons({
      data: {
        organizationId: ORG_ID,
        teamId: TEAM_ID,
      },
    });
    const games = await getAllGames({
      data: {
        organizationId: ORG_ID,
        teamId: TEAM_ID,
      },
    });

    return { seasons, games };
  },
});

import { Atom, useAtomValue } from '@effect-atom/atom-react';

const runtimeAtom = Atom.runtime(RpcGameClient.Default);

const gameAtom = runtimeAtom.atom(
  Effect.gen(function* () {
    const client = yield* RpcGameClient;
    return yield* client.GameList();
  })
);

// add players selector for like quick adding to seasons, teams when creating
function RouteComponent() {
  const data = Route.useLoaderData();

  const _gameRpcResult = useAtomValue(gameAtom);

  return (
    <div>
      <section>
        <div>Results</div>
        <div>{JSON.stringify(data, null, 4)}</div>
      </section>
      <CreateSeasonForm organizationId={ORG_ID} teamId={TEAM_ID} />
      <CreateGameForm organizationId={ORG_ID} />
      <section />
    </div>
  );
}
