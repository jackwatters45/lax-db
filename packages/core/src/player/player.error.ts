import { Schema } from 'effect';

export class PlayerError extends Schema.TaggedError<PlayerError>()(
  'PlayerError',
  {
    customMessage: Schema.optional(Schema.String),
  },
) {}
