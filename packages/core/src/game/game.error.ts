import { Schema } from 'effect';

export class ErrorInvalidGame extends Schema.TaggedError<ErrorInvalidGame>()(
  'ErrorInvalidGame',
  {},
) {}
