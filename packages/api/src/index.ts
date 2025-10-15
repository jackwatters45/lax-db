import {
  HttpApiBuilder,
  HttpApiScalar,
  HttpMiddleware,
  HttpServer,
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

// TODO: auth
const Main = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiScalar.layer({ path: '/docs' })),
  Layer.provide(HttpApiBuilder.middlewareCors({ allowedOrigins: ['*'] })),
  Layer.provide(HttpApiBuilder.middlewareOpenApi()),
  Layer.provide(GamesApiLive),
  Layer.provide(AllRpcs),
  Layer.provide(RpcProtocol),
  HttpServer.withLogAddress,
  Layer.provide(BunHttpServer.layer({ port: 3001 })),
  Layer.provide(DateTime.layerCurrentZoneLocal)
);

BunRuntime.runMain(Layer.launch(Main));
