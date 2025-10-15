// ---------------------------------------------
// RPC Handlers (Thin Adapters)
// These are just thin wrappers that map RPC calls to use cases.
// No business logic here - just protocol adaptation.
// ---------------------------------------------

import { Rpc, RpcGroup } from '@effect/rpc';
import { GameContract } from '@lax-db/core/api/game.contract';
import { GamesService } from '@lax-db/core/api/game.service';
import { Effect, Layer } from 'effect';

export class GameRpcs extends RpcGroup.make(
  Rpc.make('GameList', {
    success: GameContract.list.success,
    error: GameContract.list.error,
  }),
  Rpc.make('GameById', {
    success: GameContract.getById.success,
    error: GameContract.getById.error,
    payload: GameContract.getById.payload,
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
