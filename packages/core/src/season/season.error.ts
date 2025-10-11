import { Schema } from 'effect';

export class ErrorInvalidSeason extends Schema.TaggedError<ErrorInvalidSeason>()(
  'ErrorInvalidSeason',
  {},
) {}
