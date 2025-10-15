import { Effect, Schema } from 'effect';
import { ErrorInvalidArgs } from './error';

export const decodeArguments = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  input: I
) =>
  Effect.gen(function* () {
    return yield* Schema.decode(schema)(input).pipe(
      Effect.tapError(Effect.logError),
      Effect.mapError(() => new ErrorInvalidArgs())
    );
  });
