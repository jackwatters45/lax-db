import { Layer } from 'effect';
import { RpcGameClient } from './game/game.client';
import { RpcSeasonClient } from './season/season.client';

// Rpc Client
export const RpcClientLive = Layer.mergeAll(
  RpcGameClient.Default,
  RpcSeasonClient.Default
);
