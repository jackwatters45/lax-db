import { Data } from 'effect';

export class EmailError extends Data.TaggedError('EmailError')<{
  cause: unknown;
}> {}
