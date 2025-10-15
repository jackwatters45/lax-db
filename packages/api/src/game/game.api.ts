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
import { Game } from '@lax-db/core/api/game.schema';
import { GamesService } from '@lax-db/core/api/game.service';
import { NotFoundError, ValidationError } from '@lax-db/core/error';
import { Effect, Layer, Schema } from 'effect';

export const GamesApi = HttpApi.make('GamesApi').add(
  HttpApiGroup.make('Games')
    .add(
      HttpApiEndpoint.get('getGames', '/api/games')
        .addSuccess(Schema.Array(Game))
        .addError(NotFoundError)
        .addError(ValidationError)
    )
    .add(
      HttpApiEndpoint.get('getGameById', '/api/games/:id')
        .addSuccess(Game)
        .addError(NotFoundError)
        .addError(ValidationError)
        .setPath(Schema.Struct({ id: Schema.NumberFromString }))
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
