import { Schema } from 'effect';

export class TeamError extends Schema.TaggedError<TeamError>()('TeamError', {
  customMessage: Schema.optional(Schema.String),
}) {}
