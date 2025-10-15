import {
  HttpApiBuilder,
  HttpApiScalar,
  HttpMiddleware,
} from '@effect/platform';
import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
import { RpcSerialization, RpcServer } from '@effect/rpc';
import { DateTime, Layer } from 'effect';
import { GamesApiLive } from './game/game.api';
import { GameHandlers, GameRpcs } from './game/game.rpc';

const AllRpcs = RpcServer.layer(GameRpcs).pipe(Layer.provide(GameHandlers));

const RpcProtocol = RpcServer.layerProtocolHttp({
  path: '/rpc',
  routerTag: HttpApiBuilder.Router,
}).pipe(Layer.provide(RpcSerialization.layerNdjson));

const Main = Layer.mergeAll(
  HttpApiBuilder.serve(HttpMiddleware.cors({ allowedOrigins: ['*'] })),
  HttpApiScalar.layer({ path: '/docs' })
).pipe(
  Layer.provide(GamesApiLive),
  Layer.provide(AllRpcs),
  Layer.provide(RpcProtocol),
  Layer.provide(BunHttpServer.layer({ port: 3001 })),
  Layer.provide(DateTime.layerCurrentZoneLocal)
);

BunRuntime.runMain(Layer.launch(Main));

// // Use `HttpLayerRouter.addHttpApi` to register the API with the router
// const HttpApiRoutes = HttpLayerRouter.addHttpApi(MyApi2, {
//   openapiPath: '/docs/openapi.json',
// }).pipe(
//   // Provide the api handlers layer
//   Layer.provide(UsersApiLayer)
// );

// // Create a /docs route for the API documentation
// const DocsRoute = HttpApiScalar.layerHttpLayerRouter({
//   api: MyApi2,
//   path: '/docs',
// });

// // Finally, we merge all routes and serve them using the Node HTTP server
// const AllRoutes = Layer.mergeAll(HttpApiRoutes, DocsRoute).pipe(
//   Layer.provide(HttpLayerRouter.cors())
// );

// HttpLayerRouter.serve(AllRoutes).pipe(
//   Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
//   Layer.launch,
//   NodeRuntime.runMain
// );
