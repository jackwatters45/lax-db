// import { HttpApiBuilder, HttpServer } from '@effect/platform';
// import { Router } from '@effect/platform/HttpApiBuilder';
// import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
// import { DateTime, Layer } from 'effect';

// const Main = Router.pipe(
//   HttpServer.serve(),
//   Layer.provide(HttpApiBuilder.serve()),
//   Layer.provide(GamesApiLive),
//   Layer.provide(AllRpcs),
//   Layer.provide(RpcProtocol),
//   Layer.provide(BunHttpServer.layer({ port: 3001 })),
//   Layer.provide(DateTime.layerCurrentZoneLocal)
// );

// // Uncomment to run the server
// BunRuntime.runMain(Layer.launch(Main));
