import { type Effect, Schema } from 'effect';
import type { PlayerContactInfoService } from './contact-info.service';

export class GetPlayerContactInfoInput extends Schema.Class<GetPlayerContactInfoInput>(
  'GetPlayerContactInfoInput'
)({
  playerId: Schema.Number,
}) {}

// Return Types
type PlayerContactInfoServiceType = Effect.Effect.Success<
  typeof PlayerContactInfoService
>;

type PlayerWithContactInfo = Effect.Effect.Success<
  ReturnType<PlayerContactInfoServiceType['getPlayerWithContactInfo']>
>;

export type PlayerWithContactInfoNonNullable =
  NonNullable<PlayerWithContactInfo>;
