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
import { SeasonsApiLive } from './season/season.api';
import { SeasonHandlers, SeasonRpcs } from './season/season.rpc';

// TODO: this doesnt really make sense as AllRpcs - how to best organize
const AllRpcs = RpcServer.layer(SeasonRpcs).pipe(Layer.provide(SeasonHandlers));

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
  Layer.provide(SeasonsApiLive),
  Layer.provide(AllRpcs),
  Layer.provide(RpcProtocol),
  Layer.provide(HealthCheckRoute),
  HttpServer.withLogAddress,
  Layer.provide(BunHttpServer.layer({ port: 3001 })),
  Layer.provide(DateTime.layerCurrentZoneLocal)
);

BunRuntime.runMain(Layer.launch(Main));
