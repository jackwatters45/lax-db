import { Schema } from 'effect';

export class PlayerContactInfoError extends Schema.TaggedError<PlayerContactInfoError>()(
  'PlayerContactInfoError',
  {
    customMessage: Schema.optional(Schema.String),
  },
) {}
