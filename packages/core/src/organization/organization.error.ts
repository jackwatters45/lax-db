import { Schema } from 'effect';

export class OrganizationError extends Schema.TaggedError<OrganizationError>()(
  'OrganizationError',
  {
    customMessage: Schema.optional(Schema.String),
  },
) {}
