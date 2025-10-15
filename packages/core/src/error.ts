import { Schema } from 'effect';

export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  'NotFoundError'
)('NotFoundError', {
  domain: Schema.String,
  id: Schema.Union(Schema.Number, Schema.String),
}) {}

export class ValidationError extends Schema.TaggedError<ValidationError>(
  'ValidationError'
)('ValidationError', {
  domain: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
}) {}
