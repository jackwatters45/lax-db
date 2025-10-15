import { Rpc, RpcGroup } from '@effect/rpc';
import { Schema } from 'effect';
import { Games } from '../game/game.schema';

export class SchemaErrorInvalidGame extends Schema.TaggedError<SchemaErrorInvalidGame>(
  'ErrorInvalidGame'
)('SchemaErrorInvalidGame', {
  cause: Schema.Any,
}) {}

// rpcs
export class GameRpcs extends RpcGroup.make(
  Rpc.make('GameList', {
    success: Games,
    error: SchemaErrorInvalidGame,
  })
) {}
