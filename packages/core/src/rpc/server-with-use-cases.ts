import {
  FetchHttpClient,
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpMiddleware,
  HttpRouter,
  HttpServer,
} from '@effect/platform';
import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
import {
  Rpc,
  RpcClient,
  RpcGroup,
  RpcSerialization,
  RpcServer,
} from '@effect/rpc';
import { DateTime, Effect, Layer, Schema } from 'effect';

// ---------------------------------------------
// Schemas (Shared across RPC and HTTP API)
// These are protocol-agnostic data definitions
// ---------------------------------------------

const Game = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  date: Schema.DateTimeUtc,
});

// ---------------------------------------------
// Errors (Shared across RPC and HTTP API)
// Unified error types that both protocols understand
// ---------------------------------------------

class NotFoundError extends Schema.TaggedError<NotFoundError>('NotFoundError')(
  'NotFoundError',
  {
    entity: Schema.String,
    id: Schema.Number,
  }
) {}

class ValidationError extends Schema.TaggedError<ValidationError>(
  'ValidationError'
)('ValidationError', {
  message: Schema.String,
}) {}

// ---------------------------------------------
// Repositories (Shared Data Access Layer)
// Protocol-agnostic data access - same code used by both RPC and HTTP API
// ---------------------------------------------

class GamesRepo extends Effect.Service<GamesRepo>()('GamesRepo', {
  effect: Effect.gen(function* () {
    return {
      getAll: () =>
        Effect.gen(function* () {
          const zoned = yield* DateTime.nowInCurrentZone;
          const now = DateTime.toUtc(zoned);
          return [
            { id: 1, name: 'Game 1', date: now },
            { id: 2, name: 'Game 2', date: now },
          ];
        }),
      getById: (id: number) =>
        Effect.gen(function* () {
          const zoned = yield* DateTime.nowInCurrentZone;
          const now = DateTime.toUtc(zoned);
          return { id, name: `Game ${id}`, date: now };
        }),
    } as const;
  }),
  dependencies: [DateTime.layerCurrentZoneLocal],
}) {}

// ---------------------------------------------
// Use Cases / Services (Shared Business Logic Layer)
// This is where the magic happens - ALL business logic lives here.
// Both RPC and HTTP API handlers delegate to these use cases.
// This layer is completely protocol-agnostic.
// ---------------------------------------------

class GamesService extends Effect.Service<GamesService>()('GamesService', {
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
}) {}

// ---------------------------------------------
// RPC Handlers (Thin Adapters)
// These are just thin wrappers that map RPC calls to use cases.
// No business logic here - just protocol adaptation.
// ---------------------------------------------

class GameRpcs extends RpcGroup.make(
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

const GameHandlers = GameRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* GamesService;

    return {
      GameList: () => service.listGames(),
      GameById: ({ id }) => service.getGameById(id),
    };
  })
).pipe(Layer.provide(GamesService.Default));

// ---------------------------------------------
// HTTP API Handlers (Thin Adapters)
// These are also thin wrappers that map HTTP requests to the SAME use cases.
// Notice: Zero duplication with RPC - both use GamesService/UsersService!
// ---------------------------------------------

const GamesApi = HttpApi.make('GamesApi').add(
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

const GamesApiLive = HttpApiBuilder.api(GamesApi).pipe(
  Layer.provide(GamesApiHandlers)
);

// ---------------------------------------------
// Server Setup
// We expose Games via BOTH RPC and HTTP API!
// Both protocols use the same underlying service/business logic.
// ---------------------------------------------

const AllRpcs = RpcServer.layer(GameRpcs).pipe(Layer.provide(GameHandlers));

const RpcProtocol = RpcServer.layerProtocolHttp({ path: '/rpc' }).pipe(
  Layer.provide(RpcSerialization.layerNdjson)
);

const router = HttpRouter.empty.pipe(
  HttpRouter.use(HttpMiddleware.cors({ allowedOrigins: ['*'] }))
);

const Main = router.pipe(
  HttpServer.serve(),
  Layer.provide(HttpApiBuilder.serve()),
  Layer.provide(GamesApiLive),
  Layer.provide(AllRpcs),
  Layer.provide(RpcProtocol),
  Layer.provide(BunHttpServer.layer({ port: 3001 })),
  Layer.provide(DateTime.layerCurrentZoneLocal)
);

// Uncomment to run the server
BunRuntime.runMain(Layer.launch(Main));

// ---------------------------------------------
// Client Examples
// Now clients can access Games via BOTH protocols!
// ---------------------------------------------

// RPC Client - Access Games via RPC
const RpcProtocolLive = RpcClient.layerProtocolHttp({
  url: 'http://localhost:3001/rpc',
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));

const rpcClientProgram = Effect.gen(function* () {
  const gameClient = yield* RpcClient.make(GameRpcs);

  const games = yield* gameClient.GameList();
  const game = yield* gameClient.GameById({ id: 1 });

  console.log('RPC - Games:', games);
  console.log('RPC - Game by ID:', game);

  return { games, game };
});

// HTTP Client - Access Games via REST API
const httpClientProgram = Effect.gen(function* () {
  const gamesClient = yield* HttpApiClient.make(GamesApi, {
    baseUrl: 'http://localhost:3001',
  });

  const games = yield* gamesClient.Games.getGames();
  const game = yield* gamesClient.Games.getGameById({ path: { id: 1 } });

  console.log('HTTP - Games:', games);
  console.log('HTTP - Game by ID:', game);

  return { games, game };
});

// Combined - Use both protocols side by side
const combinedProgram = Effect.gen(function* () {
  const gameRpcClient = yield* RpcClient.make(GameRpcs);
  const gamesHttpClient = yield* HttpApiClient.make(GamesApi, {
    baseUrl: 'http://localhost:3001',
  });

  const gamesViaRpc = yield* gameRpcClient.GameList();
  const gamesViaHttp = yield* gamesHttpClient.Games.getGames();

  console.log('Same data via RPC:', gamesViaRpc);
  console.log('Same data via HTTP:', gamesViaHttp);

  return { gamesViaRpc, gamesViaHttp };
}).pipe(Effect.scoped);

const CombinedLayers = Layer.mergeAll(FetchHttpClient.layer, RpcProtocolLive);

Effect.runFork(combinedProgram.pipe(Effect.provide(CombinedLayers)));

// ---------------------------------------------
// Architecture Summary
// ---------------------------------------------

/*

KEY IMPROVEMENTS OVER PREVIOUS VERSION:

1. **Shared Business Logic Layer**
   - GamesService contains ALL business logic
   - Both RPC and HTTP API handlers delegate to this service
   - Zero duplication of validation, error handling, logging, etc.

2. **Same Resource Exposed via Both Protocols**
   - Games: Available via RPC (GameList, GameById) AND HTTP API (GET /api/games, GET /api/games/:id)
   - Both protocols use the EXACT same underlying service methods!
   - listGames() is called by both RPC GameList and HTTP GET /api/games
   - getGameById() is called by both RPC GameById and HTTP GET /api/games/:id

3. **Thin Handler Layer**
   - RPC handlers: Just map RPC calls → service methods
   - HTTP API handlers: Just map HTTP requests → service methods
   - Handlers are now 1-2 lines each - pure protocol adaptation
   - Compare to previous version where logic was duplicated in each handler!

4. **Unified Error Handling**
   - NotFoundError and ValidationError used by both protocols
   - Consistent error experience across RPC and HTTP API
   - Validation happens once in the service layer

5. **Easy to Test**
   - Test business logic once in the service layer
   - Mock the service for handler tests
   - Protocol handlers become trivial to test

6. **Easy to Extend**
   - Add new business logic? Add to service layer (ONE place)
   - Want to expose via RPC? Add thin RPC handler (1-2 lines)
   - Want to expose via HTTP? Add thin HTTP handler (1-2 lines)
   - Want both? Add both handlers - they share the same service method!

ARCHITECTURE LAYERS:

┌─────────────────────────────────────┐
│   RPC Handlers    │  HTTP Handlers  │  ← Thin protocol adapters (1-2 lines each)
├───────────────────┴─────────────────┤
│   Services / Use Cases              │  ← ALL business logic (shared)
├─────────────────────────────────────┤
│   Repositories                      │  ← Data access (shared)
├─────────────────────────────────────┤
│   Database / External Services      │
└─────────────────────────────────────┘

This is Hexagonal Architecture (Ports & Adapters) with Effect!
- Core: Services + Repositories (protocol-agnostic)
- Adapters: RPC + HTTP API handlers (protocol-specific, thin)
- Same business logic, multiple interfaces

FILE STRUCTURE RECOMMENDATION:

packages/core/src/
├── domain/
│   ├── schemas/
│   │   ├── game.schema.ts       # Game schema
│   │   └── user.schema.ts       # User schema
│   └── errors/
│       └── api-errors.ts        # NotFoundError, ValidationError, etc.
│
├── application/
│   ├── repositories/
│   │   ├── games.repo.ts        # GamesRepo
│   │   └── users.repo.ts        # UsersRepo
│   └── services/
│       ├── games.service.ts     # GamesService (use cases)
│       └── users.service.ts     # UsersService (use cases)
│
├── infrastructure/
│   ├── rpc/
│   │   ├── games.rpc.ts         # GameRpcs + thin handlers
│   │   ├── users.rpc.ts         # UserRpcs + thin handlers
│   │   └── index.ts
│   ├── http/
│   │   ├── games.api.ts         # GamesApi + thin handlers
│   │   ├── users.api.ts         # UsersApi + thin handlers
│   │   └── index.ts
│   └── server.ts                # Server setup
│
└── clients/
    ├── rpc-client.ts
    ├── http-client.ts
    └── combined-client.ts

This is Domain-Driven Design structure:
- domain/: Pure business entities (schemas, errors)
- application/: Business logic (services, repos)
- infrastructure/: Technical details (RPC, HTTP, database)

*/
