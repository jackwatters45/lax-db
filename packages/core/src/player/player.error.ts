import { Data } from 'effect';

export class PlayerError extends Data.TaggedError('PlayerError')<{
  cause: unknown;
  message?: string;
}> {}
