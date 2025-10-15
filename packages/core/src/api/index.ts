import {
  FetchHttpClient,
  HttpApi,
  HttpApiBuilder,
  HttpApiClient,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform';
import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
import { Effect, Layer, Schema } from 'effect';

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
  Layer.provide(BunHttpServer.layer({ port: 3002 }))
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

// Configure and serve the API
const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  // Add CORS middleware to handle cross-origin requests
  Layer.provide(HttpApiBuilder.middlewareCors()),
  // Provide the API implementation
  Layer.provide(MyApiLive),
  // Log the server's listening address
  HttpServer.withLogAddress,
  // Set up the Node.js HTTP server
  Layer.provide(BunHttpServer.layer({ port: 3002 }))
);

// Launch the server
Layer.launch(HttpLive).pipe(BunRuntime.runMain);
