// server.ts
import { HttpLayerRouter, HttpMiddleware, HttpRouter } from '@effect/platform';
import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
import { RpcSerialization, RpcServer } from '@effect/rpc';
import { Layer } from 'effect';
import { GameLive } from './handler';
import { GameRpcs } from './request';

// Create the RPC server layer
const RpcLayer = RpcServer.layer(GameRpcs).pipe(Layer.provide(GameLive));

const _CorsMiddleware = HttpLayerRouter.middleware(HttpMiddleware.cors(), {
  global: true,
});

// Choose the protocol and serialization format
const HttpProtocol = RpcServer.layerProtocolHttp({
  path: '/rpc',
}).pipe(Layer.provide(RpcSerialization.layerNdjson));

// Create the main server layer
const Main = HttpRouter.Default.serve().pipe(
  Layer.provide(RpcLayer),
  Layer.provide(HttpProtocol),
  // Layer.provide(CorsMiddleware),
  Layer.provide(BunHttpServer.layer({ port: 3001 }))
);

BunRuntime.runMain(Layer.launch(Main));
