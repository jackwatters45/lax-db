import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpMiddleware,
  HttpRouter,
  HttpServer,
} from '@effect/platform';
import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
import { Rpc, RpcGroup, RpcSerialization, RpcServer } from '@effect/rpc';
import { DateTime, Effect, Layer, Schema } from 'effect';

// ---------------------------------------------
// Schemas
// ---------------------------------------------

const User = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  createdAt: Schema.DateTimeUtc,
});

const Game = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  date: Schema.DateTimeUtc,
});

class GameError extends Schema.TaggedError<GameError>('GameError')(
  'GameError',
  {
    message: Schema.String,
  }
) {}

// ---------------------------------------------
// Services (Repository Pattern)
// These services contain all business logic for data access.
// They use Effect.Service for dependency injection and can be easily mocked for testing.
// ---------------------------------------------

class GamesRepo extends Effect.Service<GamesRepo>()('GamesRepo', {
  effect: Effect.gen(function* () {
    return {
      getAll: () =>
        Effect.gen(function* () {
          const zoned = yield* DateTime.nowInCurrentZone;
          const now = DateTime.toUtc(zoned);
          return [
            {
              id: 1,
              name: 'Game 1',
              date: now,
            },
            {
              id: 2,
              name: 'Game 2',
              date: now,
            },
          ];
        }),
      getById: (id: number) =>
        Effect.gen(function* () {
          const zoned = yield* DateTime.nowInCurrentZone;
          const now = DateTime.toUtc(zoned);
          return {
            id,
            name: `Game ${id}`,
            date: now,
          };
        }),
    } as const;
  }),
  dependencies: [DateTime.layerCurrentZoneLocal],
}) {}

class UsersRepo extends Effect.Service<UsersRepo>()('UsersRepo', {
  effect: Effect.gen(function* () {
    return {
      getAll: () =>
        Effect.gen(function* () {
          const zoned = yield* DateTime.nowInCurrentZone;
          const now = DateTime.toUtc(zoned);
          return [
            {
              id: 1,
              name: 'John Doe',
              createdAt: now,
            },
            {
              id: 2,
              name: 'Jane Smith',
              createdAt: now,
            },
          ];
        }),
    } as const;
  }),
  dependencies: [DateTime.layerCurrentZoneLocal],
}) {}

// ---------------------------------------------
// RPC Definition & Handlers
// Define RPC endpoints with schemas for request/response.
// Handlers delegate to repository services for business logic.
// ---------------------------------------------

class GameRpcs extends RpcGroup.make(
  Rpc.make('GameList', {
    success: Schema.Array(Game),
    error: GameError,
  }),
  Rpc.make('GameById', {
    success: Game,
    error: GameError,
    payload: {
      id: Schema.Number,
    },
  })
) {}

const GameHandlers = GameRpcs.toLayer(
  Effect.gen(function* () {
    const repo = yield* GamesRepo;

    return {
      GameList: () => repo.getAll(),
      GameById: ({ id }) => repo.getById(id),
    };
  })
).pipe(Layer.provide(GamesRepo.Default));

// ---------------------------------------------
// HTTP API Definition & Handlers
// Define REST endpoints with HttpApi.
// Handlers follow the same pattern as RPC: delegate to repository services.
// ---------------------------------------------

const MyApi = HttpApi.make('MyApi').add(
  HttpApiGroup.make('Users').add(
    HttpApiEndpoint.get('getUsers', '/api/users').addSuccess(Schema.Array(User))
  )
);

const UsersLive = HttpApiBuilder.group(MyApi, 'Users', (handlers) =>
  Effect.gen(function* () {
    const repo = yield* UsersRepo;

    return handlers.handle('getUsers', () => repo.getAll());
  })
).pipe(Layer.provide(UsersRepo.Default));

const MyApiLive = HttpApiBuilder.api(MyApi).pipe(Layer.provide(UsersLive));

// ---------------------------------------------
// Server Setup
// Combines both HTTP API and RPC on the same server.
// Both register routes to HttpRouter.Default and coexist at different paths:
// - HTTP API: /api/*
// - RPC: /rpc
// ---------------------------------------------

const RpcLayer = RpcServer.layer(GameRpcs).pipe(Layer.provide(GameHandlers));

const RpcProtocol = RpcServer.layerProtocolHttp({ path: '/rpc' }).pipe(
  Layer.provide(RpcSerialization.layerNdjson)
);

const router = HttpRouter.empty.pipe(
  HttpRouter.use(HttpMiddleware.cors({ allowedOrigins: ['*'] }))
);

const Main = router.pipe(
  HttpServer.serve(),
  Layer.provide(HttpApiBuilder.serve()),
  Layer.provide(MyApiLive),
  Layer.provide(RpcLayer),
  Layer.provide(RpcProtocol),
  Layer.provide(BunHttpServer.layer({ port: 3001 })),
  Layer.provide(DateTime.layerCurrentZoneLocal)
);

// Uncomment to run the server
BunRuntime.runMain(Layer.launch(Main));

// ---------------------------------------------
// Client Examples
// ---------------------------------------------

// HTTP API Client
// Uses HttpApiClient to derive a fully-typed client from the API definition.
// The client automatically handles request/response serialization and validation.

import { FetchHttpClient, HttpApiClient } from '@effect/platform';
import { RpcClient } from '@effect/rpc';

const _httpApiClientProgram = Effect.gen(function* () {
  // Derive a typed client from the API definition
  const client = yield* HttpApiClient.make(MyApi, {
    baseUrl: 'http://localhost:3001',
  });

  // Call endpoints - fully type-safe!
  const users = yield* client.Users.getUsers();

  return users;
});

// Run the client program
// Effect.runFork(
//   httpApiClientProgram.pipe(Effect.provide(FetchHttpClient.layer)),
// );

// ---------------------------------------------
// RPC Client
// Uses RpcClient with the same RpcGroup definition as the server.
// Supports streaming and uses NDJSON for serialization.
// ---------------------------------------------

// Configure the RPC protocol layer
const RpcProtocolLive = RpcClient.layerProtocolHttp({
  url: 'http://localhost:3001/rpc',
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));

const _rpcClientProgram = Effect.gen(function* () {
  // Create an RPC client
  const client = yield* RpcClient.make(GameRpcs);

  // Call RPC methods - fully type-safe!
  const games = yield* client.GameList();

  const game = yield* client.GameById({ id: 1 });

  return { games, game };
});

// Run the RPC client program
// Effect.runFork(rpcClientProgram.pipe(Effect.provide(RpcProtocolLive)));

// ---------------------------------------------
// RPC Client as a Service
// Wrap the RPC client in an Effect.Service for dependency injection.
// This makes it easy to inject into other services and test with mocks.
// ---------------------------------------------

class RpcGameClient extends Effect.Service<RpcGameClient>()('RpcGameClient', {
  dependencies: [RpcProtocolLive],
  scoped: RpcClient.make(GameRpcs),
}) {}

const _rpcServiceProgram = Effect.gen(function* () {
  // Access the RPC client as a service
  const gameClient = yield* RpcGameClient;

  const games = yield* gameClient.GameList();

  return games;
});

// Run with service layer
// Effect.runFork(
//   rpcServiceProgram.pipe(Effect.provide(RpcGameClient.Default)),
// );

// ---------------------------------------------
// Combined Client Example
// Use both HTTP API and RPC clients in a single program.
// ---------------------------------------------

const combinedProgram = Effect.gen(function* () {
  // Create both clients
  const httpClient = yield* HttpApiClient.make(MyApi, {
    baseUrl: 'http://localhost:3001',
  });
  const rpcClient = yield* RpcClient.make(GameRpcs);

  // Call both APIs
  const users = yield* httpClient.Users.getUsers();
  const games = yield* rpcClient.GameList();

  return { users, games };
}).pipe(Effect.scoped);

// Run with both protocol layers
const CombinedLayers = Layer.mergeAll(FetchHttpClient.layer, RpcProtocolLive);

Effect.runFork(combinedProgram.pipe(Effect.provide(CombinedLayers)));

// ---------------------------------------------
// File Separation Plan
// ---------------------------------------------

/*
Recommended file structure for production:

packages/core/src/rpc/
├── schemas/
│   ├── game.schema.ts          # Game schema & GameError
│   └── user.schema.ts          # User schema
│
├── repositories/
│   ├── games.repo.ts           # GamesRepo service
│   └── users.repo.ts           # UsersRepo service
│
├── rpc/
│   ├── game.rpc.ts             # GameRpcs definition & GameHandlers
│   └── index.ts                # Export all RPC groups
│
├── api/
│   ├── users.api.ts            # MyApi definition & UsersLive handlers
│   └── index.ts                # Export all API groups
│
├── server.ts                    # Server setup (Main, router, protocols)
│
└── clients/
    ├── http-client.ts          # HTTP API client examples
    ├── rpc-client.ts           # RPC client examples
    └── combined-client.ts      # Combined client example

Benefits of This Structure:
1. Separation of Concerns - Each file has a single responsibility
2. Easy to Test - Schemas, repos, and handlers can be tested independently
3. Reusability - Schemas and repos can be shared across RPC and HTTP API
4. Scalability - Easy to add new endpoints by creating new files
5. Type Safety - Import/export maintains full type safety across boundaries
6. Clear Dependencies - Easy to see what depends on what
7. Client Organization - Client code is separate from server code

Migration Path:
1. Create directory structure
2. Extract schemas first (no dependencies)
3. Extract repositories (depend on schemas)
4. Extract RPC definitions and handlers (depend on schemas + repos)
5. Extract HTTP API definitions and handlers (depend on schemas + repos)
6. Update server.ts to import from new files
7. Create client files last (depend on exported RPC/API definitions)
*/
