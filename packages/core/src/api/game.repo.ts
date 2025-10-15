import { DateTime, Effect } from 'effect';

// ---------------------------------------------
// Repositories (Shared Data Access Layer)
// Protocol-agnostic data access - same code used by both RPC and HTTP API
// ---------------------------------------------
export class GamesRepo extends Effect.Service<GamesRepo>()('GamesRepo', {
  effect: Effect.gen(function* () {
    const zoned = yield* DateTime.nowInCurrentZone;
    return {
      getAll: () =>
        Effect.gen(function* () {
          const now = DateTime.toUtc(zoned);
          return [
            { id: 1, name: 'Game 1', date: now },
            { id: 2, name: 'Game 2', date: now },
          ];
        }),
      getById: (id: number) =>
        Effect.gen(function* () {
          const now = DateTime.toUtc(zoned);
          return { id, name: `Game ${id}`, date: now };
        }),
    } as const;
  }),
  dependencies: [DateTime.layerCurrentZoneLocal],
}) {}
