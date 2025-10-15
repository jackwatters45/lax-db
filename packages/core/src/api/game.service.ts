import { NotFoundError, ValidationError } from '@lax-db/core/error';
import { Effect } from 'effect';

import { GamesRepo } from './game.repo';

// ---------------------------------------------
// Use Cases / Services (Shared Business Logic Layer)
// This is where the magic happens - ALL business logic lives here.
// Both RPC and HTTP API handlers delegate to these use cases.
// This layer is completely protocol-agnostic.
// ---------------------------------------------
export class GamesService extends Effect.Service<GamesService>()(
  'GamesService',
  {
    effect: Effect.gen(function* () {
      const repo = yield* GamesRepo;

      return {
        listGames: () =>
          repo.getAll().pipe(
            Effect.tap((games) => Effect.log(`Found ${games.length} games`)),
            Effect.tapError((error) =>
              Effect.logError('Failed to list games', error)
            )
          ),

        getGameById: (id: number) =>
          Effect.gen(function* () {
            if (id <= 0) {
              return yield* Effect.fail(
                new ValidationError({ message: 'Game ID must be positive' })
              );
            }

            const game = yield* repo.getById(id);

            if (!game) {
              return yield* Effect.fail(
                new NotFoundError({ entity: 'Game', id })
              );
            }

            return game;
          }).pipe(Effect.tap((game) => Effect.log(`Found game: ${game.name}`))),
      } as const;
    }),
    dependencies: [GamesRepo.Default],
  }
) {}
