import { Schema } from 'effect';

export class FeedbackError extends Schema.TaggedError<FeedbackError>()(
  'FeedbackError',
  {},
) {}
