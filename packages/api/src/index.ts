import {
  HttpApiBuilder,
  HttpApiScalar,
  HttpMiddleware,
  HttpServer,
  HttpServerResponse,
} from '@effect/platform';
import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
import { RpcSerialization, RpcServer } from '@effect/rpc';
import { DateTime, Layer } from 'effect';
import { GamesApiLive } from './game/game.api';
import { GameHandlers, GameRpcs } from './game/game.rpc';
import { PlayersApiLive } from './player/player.api';
import { PlayerHandlers, PlayerRpcs } from './player/player.rpc';
import { SeasonsApiLive } from './season/season.api';
import { SeasonHandlers, SeasonRpcs } from './season/season.rpc';

const AllRpcs = Layer.mergeAll(
  RpcServer.layer(SeasonRpcs).pipe(Layer.provide(SeasonHandlers)),
  RpcServer.layer(GameRpcs).pipe(Layer.provide(GameHandlers)),
  RpcServer.layer(PlayerRpcs).pipe(Layer.provide(PlayerHandlers))
);

const AllApis = Layer.mergeAll(SeasonsApiLive, GamesApiLive, PlayersApiLive);

const RpcProtocol = RpcServer.layerProtocolHttp({
  path: '/rpc',
  routerTag: HttpApiBuilder.Router,
}).pipe(Layer.provide(RpcSerialization.layerNdjson));

const HealthCheckRoute = HttpApiBuilder.Router.use((router) =>
  router.get('/health', HttpServerResponse.text('OK'))
);

const Main = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiScalar.layer({ path: '/docs' })),
  Layer.provide(HttpApiBuilder.middlewareCors({ allowedOrigins: ['*'] })),
  Layer.provide(HttpApiBuilder.middlewareOpenApi()),
  Layer.provide(AllApis),
  Layer.provide(AllRpcs),
  Layer.provide(RpcProtocol),
  Layer.provide(HealthCheckRoute),
  HttpServer.withLogAddress,
  Layer.provide(BunHttpServer.layer({ port: 3001 })),
  Layer.provide(DateTime.layerCurrentZoneLocal)
);

BunRuntime.runMain(Layer.launch(Main));
