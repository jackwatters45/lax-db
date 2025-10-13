import { Data } from 'effect';

export class PlayerContactInfoError extends Data.TaggedError(
  'PlayerContactInfoError',
)<{
  cause: unknown;
  message?: string;
}> {}
