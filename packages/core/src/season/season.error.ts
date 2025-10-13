import { Data } from 'effect';

export class ErrorInvalidSeason extends Data.TaggedError('ErrorInvalidSeason')<{
  cause: unknown;
}> {}
