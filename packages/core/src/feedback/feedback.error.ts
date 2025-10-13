import { Data } from 'effect';

export class FeedbackError extends Data.TaggedError('FeedbackError')<{
  cause: unknown;
}> {}
