import { Data, Schema } from 'effect';

export class ErrorInvalidArgs extends Data.TaggedError(
  'ErrorInvalidArgs'
)<{}> {}

export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  'NotFoundError'
)('NotFoundError', {
  entity: Schema.String,
  id: Schema.Number,
}) {}

export class ValidationError extends Schema.TaggedError<ValidationError>(
  'ValidationError'
)('ValidationError', {
  message: Schema.String,
}) {}
