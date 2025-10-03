import { Schema as S } from 'effect';

export const Base64IdSchema = (msg?: string) =>
  S.String.pipe(
    S.pattern(/^[a-zA-Z0-9]{32}$/, {
      message: () => msg ?? 'Invalid Base64 ID format',
    }),
  );

export const JerseyNumberSchema = S.Number.pipe(
  S.int({ message: () => 'Jersey number must be a whole number' }),
  S.greaterThanOrEqualTo(0, {
    message: () => 'Jersey number must be 0 or greater',
  }),
  S.lessThanOrEqualTo(1000, {
    message: () => 'Jersey number must be 1000 or less',
  }),
);

export const NullableJerseyNumberSchema = S.NullOr(JerseyNumberSchema);

export const EmailSchema = S.String.pipe(
  S.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: () => 'Please enter a valid email address',
  }),
);

export const NullableEmailSchema = S.NullOr(S.String);

export const PlayerNameSchema = S.String.pipe(
  S.minLength(1, {
    message: () => 'Player name must be at least 1 character',
  }),
  S.maxLength(100, {
    message: () => 'Player name must be 100 characters or less',
  }),
  S.trimmed(),
);

export const NullablePlayerNameSchema = S.NullOr(PlayerNameSchema);
