import { Data } from 'effect';

export class ErrorInvalidArgs extends Data.TaggedError(
  'ErrorInvalidArgs'
)<{}> {}
