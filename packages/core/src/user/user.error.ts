import { Schema } from 'effect';

export class UserError extends Schema.TaggedError<UserError>()('UserError', {
  customMessage: Schema.optional(Schema.String),
}) {}
