import { Layer } from 'effect';
import { RpcGameClient } from './game/game.client';

// ---------------------------------------------
// Client Examples
// Now clients can access Games via BOTH protocols!
// ---------------------------------------------

// RPC Client - Access Games via RPC

export const RpcClientLive = Layer.mergeAll(RpcGameClient.Default);
// const rpcClientProgram = Effect.gen(function* () {
//   const gameClient = yield* RpcClient.make(GameRpcs);

//   const games = yield* gameClient.GameList();
//   const game = yield* gameClient.GameById({ id: 1 });

//   console.log('RPC - Games:', games);
//   console.log('RPC - Game by ID:', game);

//   return { games, game };
// });

// // HTTP Client - Access Games via REST API
// const httpClientProgram = Effect.gen(function* () {
//   const gamesClient = yield* HttpApiClient.make(GamesApi, {
//     baseUrl: 'http://localhost:3001',
//   });

//   const games = yield* gamesClient.Games.getGames();
//   const game = yield* gamesClient.Games.getGameById({ path: { id: 1 } });

//   console.log('HTTP - Games:', games);
//   console.log('HTTP - Game by ID:', game);

//   return { games, game };
// });

// // Combined - Use both protocols side by side
// const combinedProgram = Effect.gen(function* () {
//   const gameRpcClient = yield* RpcClient.make(GameRpcs);
//   const gamesHttpClient = yield* HttpApiClient.make(GamesApi, {
//     baseUrl: 'http://localhost:3001',
//   });

//   const gamesViaRpc = yield* gameRpcClient.GameList();
//   const gamesViaHttp = yield* gamesHttpClient.Games.getGames();

//   console.log('Same data via RPC:', gamesViaRpc);
//   console.log('Same data via HTTP:', gamesViaHttp);

//   return { gamesViaRpc, gamesViaHttp };
// }).pipe(Effect.scoped);

// const CombinedLayers = Layer.mergeAll(FetchHttpClient.layer, RpcProtocolLive);

// Effect.runFork(combinedProgram.pipe(Effect.provide(CombinedLayers)));

// TODO: runtime?
