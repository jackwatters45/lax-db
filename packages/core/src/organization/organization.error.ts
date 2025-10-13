import { Data } from 'effect';

export class OrganizationError extends Data.TaggedError('OrganizationError')<{
  cause: unknown;
  message?: string;
}> {}
