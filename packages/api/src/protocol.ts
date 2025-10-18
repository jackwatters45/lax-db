import { FetchHttpClient } from '@effect/platform';
import { RpcClient, RpcSerialization } from '@effect/rpc';
import { Layer } from 'effect';
import { Resource } from 'sst';

export const RpcProtocolLive = RpcClient.layerProtocolHttp({
  url: `${Resource.Api.url}/rpc`,
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));
