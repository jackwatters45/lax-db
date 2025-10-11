import { Schema } from 'effect';

export class EmailError extends Schema.TaggedError<EmailError>()(
  'EmailError',
  {},
) {}
