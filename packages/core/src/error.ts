import { Schema } from 'effect';

export class ErrorInvalidArgs extends Schema.TaggedError<ErrorInvalidArgs>()(
  'ErrorInvalidArgs',
  {},
) {}
