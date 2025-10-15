// client.ts
import { FetchHttpClient } from '@effect/platform';
import { RpcClient, RpcSerialization } from '@effect/rpc';
import { Effect, Layer } from 'effect';
import { GameRpcs } from './request';

// Choose which protocol to use
const ProtocolLive = RpcClient.layerProtocolHttp({
  url: 'http://localhost:3001/rpc',
}).pipe(
  Layer.provide([
    // use fetch for http requests
    FetchHttpClient.layer,
    // use ndjson for serialization
    RpcSerialization.layerNdjson,
  ])
);

export class RpcGameClient extends Effect.Service<RpcGameClient>()(
  'RpcGameClient',
  {
    dependencies: [ProtocolLive],
    scoped: RpcClient.make(GameRpcs),
  }
) {}

// Use the client
const program = Effect.gen(function* () {
  const client = yield* RpcClient.make(GameRpcs);
  return yield* client.GameList();
  // let users = yield* Stream.runCollect(client.UserList({}));
  // if (Option.isNone(Chunk.findFirst(users, (user) => user.id === '3'))) {
  //   console.log(`Creating user "Charlie"`);
  //   yield* client.UserCreate({ name: 'Charlie' });
  //   users = yield* Stream.runCollect(client.UserList({}));
  // } else {
  //   console.log(`User "Charlie" already exists`);
  // }
  // return users;
}).pipe(Effect.scoped);

program.pipe(Effect.provide(ProtocolLive), Effect.runPromise).then(console.log);
