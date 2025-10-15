import { Effect, Schema } from 'effect';
import { ValidationError } from './error';

export const decodeArguments = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  input: I
) =>
  Schema.decode(schema)(input).pipe(
    Effect.tapError(Effect.logError),
    Effect.mapError(() => new ValidationError())
  );
