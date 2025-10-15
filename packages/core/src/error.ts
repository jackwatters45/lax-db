import { Schema } from 'effect';

export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  'NotFoundError'
)('NotFoundError', {
  domain: Schema.String,
  id: Schema.Union(Schema.Number, Schema.String),
  message: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class ValidationError extends Schema.TaggedError<ValidationError>(
  'ValidationError'
)('ValidationError', {
  domain: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}

export class DatabaseError extends Schema.TaggedError<DatabaseError>(
  'DatabaseError'
)('DatabaseError', {
  code: Schema.optional(Schema.String),
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class ConstraintViolationError extends Schema.TaggedError<ConstraintViolationError>(
  'ConstraintViolationError'
)('ConstraintViolationError', {
  constraint: Schema.String,
  code: Schema.String,
  detail: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Unknown),
}) {}
