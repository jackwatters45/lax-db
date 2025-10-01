import { Schema as S } from 'effect';

export const Base64IdSchema = (msg?: string) =>
  S.String.pipe(
    S.pattern(/^[a-zA-Z0-9]{32}$/, {
      message: () => msg ?? 'Invalid Base64 ID format',
    }),
  );
