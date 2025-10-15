import {
  FetchHttpClient,
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiScalar,
  HttpApiSwagger,
  HttpMiddleware,
  HttpRouter,
  HttpServer,
} from '@effect/platform';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServerResponse from '@effect/platform/HttpServerResponse';
import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
import * as Context from 'effect/Context';

// Define our API with one group named "Greetings" and one endpoint called "hello-world"
const MyApi = HttpApi.make('MyApi').add(
  HttpApiGroup.make('Greetings').add(
    HttpApiEndpoint.get('hello-world')`/`.addSuccess(Schema.String)
  )
);

// Implement the "Greetings" group
const GreetingsLive = HttpApiBuilder.group(MyApi, 'Greetings', (handlers) =>
  handlers.handle('hello-world', () => Effect.succeed('Hello, World!'))
);

// Provide the implementation for the API
const MyApiLive = HttpApiBuilder.api(MyApi).pipe(Layer.provide(GreetingsLive));

// Set up the server using NodeHttpServer on port 3000
const ServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(MyApiLive),
  Layer.provide(BunHttpServer.layer(createServer))
  // Layer.provide(BunHttpServer.layer(createServer, { port: 3002 })),
);

// Launch the server
Layer.launch(ServerLive).pipe(BunRuntime.runMain);

// Create a program that derives and uses the client
const program = Effect.gen(function* () {
  // Derive the client
  const client = yield* HttpApiClient.make(MyApi, {
    baseUrl: 'http://localhost:3000',
  });
  // Call the "hello-world" endpoint
  const _hello = yield* client.Greetings['hello-world']();
});

// Provide a Fetch-based HTTP client and run the program
Effect.runFork(program.pipe(Effect.provide(FetchHttpClient.layer)));

// Output: Hello, World!

// Server which is somehow different??

// Define the router with a single route for the root URL
const router = HttpRouter.empty.pipe(
  HttpRouter.get('/', HttpServerResponse.text('Hello World'))
);

// Set up the application server with logging
const app = router.pipe(HttpServer.serve(), HttpServer.withLogAddress);

// Specify the port
const port = 3000;

// Create a server layer with the specified port
const ServerLive2 = BunHttpServer.layer({ port });

// Run the application
BunRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive2)));

/*
Output:
timestamp=... level=INFO fiber=#0 message="Listening on http://localhost:3000"
*/

const _CorsMiddleware = HttpLayerRouter.middleware(
  HttpMiddleware.cors({ allowedOrigins: ['*'] }),
  {
    global: true,
  }
);

class CurrentSession extends Context.Tag('CurrentSession')<
  CurrentSession,
  {
    readonly token: string;
  }
>() {}

const SessionMiddleware = HttpLayerRouter.middleware<{
  provides: CurrentSession;
}>()(
  Effect.gen(function* () {
    yield* Effect.log('SessionMiddleware initialized');

    return (httpEffect) =>
      Effect.provideService(httpEffect, CurrentSession, {
        token: 'dummy-token',
      });
  })
);

// Here is a middleware that uses the `CurrentSession` service
const LogMiddleware = HttpLayerRouter.middleware(
  Effect.gen(function* () {
    yield* Effect.log('LogMiddleware initialized');

    return Effect.fn(function* (httpEffect) {
      const session = yield* CurrentSession;
      yield* Effect.log(`Current session token: ${session.token}`);
      return yield* httpEffect;
    });
  })
);

// We can then use the .combine method to combine the middlewares
const LogAndSessionMiddleware = LogMiddleware.combine(SessionMiddleware);

const _HelloRoute = HttpLayerRouter.add(
  'GET',
  '/hello',
  Effect.gen(function* () {
    const session = yield* CurrentSession;
    return HttpServerResponse.text(
      `Hello, World! Your session token is: ${session.token}`
    );
  })
).pipe(Layer.provide(LogAndSessionMiddleware.layer));

// Registering a HttpApi

// First, we define our HttpApi
class MyApi2 extends HttpApi.make('api').add(
  HttpApiGroup.make('users')
    .add(HttpApiEndpoint.get('me', '/me'))
    .prefix('/users')
) {}

// Implement the handlers for the API
const UsersApiLayer = HttpApiBuilder.group(MyApi2, 'users', (handers) =>
  handers.handle('me', () => Effect.void)
);

// Use `HttpLayerRouter.addHttpApi` to register the API with the router
const HttpApiRoutes = HttpLayerRouter.addHttpApi(MyApi2, {
  openapiPath: '/docs/openapi.json',
}).pipe(
  // Provide the api handlers layer
  Layer.provide(UsersApiLayer)
);

// Create a /docs route for the API documentation
const DocsRoute = HttpApiScalar.layerHttpLayerRouter({
  api: MyApi2,
  path: '/docs',
});

// Finally, we merge all routes and serve them using the Node HTTP server
const AllRoutes = Layer.mergeAll(HttpApiRoutes, DocsRoute).pipe(
  Layer.provide(HttpLayerRouter.cors())
);

HttpLayerRouter.serve(AllRoutes).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
  Layer.launch,
  NodeRuntime.runMain
);

import { createServer } from 'node:http';
// RPC
// import { HttpLayerRouter } from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from '@effect/platform-node';
import { Rpc, RpcGroup, RpcSerialization, RpcServer } from '@effect/rpc';
import { Effect, Layer, Schema } from 'effect';

export class User extends Schema.Class<User>('User')({
  id: Schema.String,
  name: Schema.String,
}) {}

// Define a group of RPCs
export class UserRpcs extends RpcGroup.make(
  Rpc.make('UserById', {
    success: User,
    error: Schema.String, // Indicates that errors, if any, will be returned as strings
    payload: {
      id: Schema.String,
    },
  })
) {}

const UserHandlers = UserRpcs.toLayer({
  UserById: ({ id }) => Effect.succeed(new User({ id, name: 'John Doe' })),
});

// Use `HttpLayerRouter` to register the rpc server
const RpcRoute = RpcServer.layerHttpRouter({
  group: UserRpcs,
  path: '/rpc',
}).pipe(
  Layer.provide(UserHandlers),
  Layer.provide(RpcSerialization.layerJson),
  Layer.provide(HttpLayerRouter.cors()) // provide CORS middleware
);

// Start the HTTP server with the RPC route
HttpLayerRouter.serve(RpcRoute).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
  Layer.launch,
  NodeRuntime.runMain
);
