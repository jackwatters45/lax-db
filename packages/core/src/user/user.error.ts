import { Data } from 'effect';

export class UserError extends Data.TaggedError('UserError')<{
  cause: unknown;
  message?: string;
}> {}
