import { Data } from 'effect';

export class ErrorInvalidGame extends Data.TaggedError('ErrorInvalidGame')<{
  cause: unknown;
}> {}
