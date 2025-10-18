import { FetchHttpClient } from '@effect/platform';
import { RpcClient } from '@effect/rpc';
import { AtomHttpApi, AtomRpc } from '@effect-atom/atom-react';
import { Effect } from 'effect';
import { Resource } from 'sst';
import { RpcProtocolLive } from '../protocol';
import { GamesApi } from './game.api';
import { GameRpcs } from './game.rpc';

export class RpcGameClient extends Effect.Service<RpcGameClient>()(
  'RpcGameClient',
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(GameRpcs),
  }
) {}

export class RpcGameClientAtom extends AtomRpc.Tag<RpcGameClientAtom>()(
  'RpcGameClientAtom',
  {
    group: GameRpcs,
    protocol: RpcProtocolLive,
  }
) {}

export class HttpGameClientAtom extends AtomHttpApi.Tag<HttpGameClientAtom>()(
  'HttpGameClientAtom',
  {
    api: GamesApi,
    httpClient: FetchHttpClient.layer,
    baseUrl: Resource.Api.url,
  }
) {}
