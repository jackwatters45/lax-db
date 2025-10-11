import { Effect, Schema as S } from 'effect';

export class ErrorInvalidArgs extends S.TaggedError<ErrorInvalidArgs>()(
  'ErrorInvalidArgs',
  {},
) {}

export const decodeArguments = <A, I, R>(schema: S.Schema<A, I, R>, input: I) =>
  Effect.gen(function* () {
    return yield* S.decode(schema)(input).pipe(
      Effect.tapError((err) => Effect.logError(err)),
      Effect.mapError(() => new ErrorInvalidArgs()),
    );
  });
