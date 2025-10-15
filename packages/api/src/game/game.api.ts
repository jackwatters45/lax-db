// ---------------------------------------------
// HTTP API Handlers (Thin Adapters)
// These are also thin wrappers that map HTTP requests to the SAME use cases.
// Notice: Zero duplication with RPC - both use GamesService/UsersService!
// ---------------------------------------------

import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from '@effect/platform';
import { GameContract } from '@lax-db/core/api/game.contract';
import { GamesService } from '@lax-db/core/api/game.service';
import { NotFoundError, ValidationError } from '@lax-db/core/error';
import { Effect, Layer } from 'effect';

export const GamesApi = HttpApi.make('GamesApi').add(
  HttpApiGroup.make('Games')
    .add(
      HttpApiEndpoint.get('getGames', '/api/games')
        .addSuccess(GameContract.list.success)
        .addError(NotFoundError)
        .addError(ValidationError)
    )
    .add(
      HttpApiEndpoint.get('getGameById', '/api/games/:id')
        .addSuccess(GameContract.getById.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .setPath(GameContract.getById.path)
    )
);

const GamesApiHandlers = HttpApiBuilder.group(GamesApi, 'Games', (handlers) =>
  Effect.gen(function* () {
    const service = yield* GamesService;

    return handlers
      .handle('getGames', () => service.listGames())
      .handle('getGameById', ({ path }) => service.getGameById(path.id));
  })
).pipe(Layer.provide(GamesService.Default));

export const GamesApiLive = HttpApiBuilder.api(GamesApi).pipe(
  Layer.provide(GamesApiHandlers)
);
