// ---------------------------------------------
// RPC Handlers (Thin Adapters)
// These are just thin wrappers that map RPC calls to use cases.
// No business logic here - just protocol adaptation.
// ---------------------------------------------

import { Rpc, RpcGroup } from '@effect/rpc';
import { Game } from '@lax-db/core/api/game.schema';
import { GamesService } from '@lax-db/core/api/game.service';
import { NotFoundError, ValidationError } from '@lax-db/core/error';
import { Effect, Layer, Schema } from 'effect';

export class GameRpcs extends RpcGroup.make(
  Rpc.make('GameList', {
    success: Schema.Array(Game),
    error: Schema.Union(NotFoundError, ValidationError),
  }),
  Rpc.make('GameById', {
    success: Game,
    error: Schema.Union(NotFoundError, ValidationError),
    payload: { id: Schema.Number },
  })
) {}

export const GameHandlers = GameRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* GamesService;

    return {
      GameList: () => service.listGames(),
      GameById: ({ id }) => service.getGameById(id),
    };
  })
).pipe(Layer.provide(GamesService.Default));
