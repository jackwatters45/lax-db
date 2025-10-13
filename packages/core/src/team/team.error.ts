import { Data } from 'effect';

export class TeamError extends Data.TaggedError('TeamError')<{
  cause: unknown;
  message?: string;
}> {}
