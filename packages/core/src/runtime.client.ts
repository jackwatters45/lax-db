import { Layer, ManagedRuntime } from 'effect';
import { RpcGameClient } from './rpc/client';

const MainLayer = Layer.mergeAll(RpcGameClient.Default);

export const RuntimeClient = ManagedRuntime.make(MainLayer);
