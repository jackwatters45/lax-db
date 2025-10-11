import { Schema } from 'effect';

export class GetPlayerContactInfoInput extends Schema.Class<GetPlayerContactInfoInput>(
  'GetPlayerContactInfoInput',
)({
  playerId: Schema.Number,
}) {}
