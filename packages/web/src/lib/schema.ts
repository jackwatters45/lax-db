import { Schema as S } from 'effect';

export const TeamIdSchema = S.Struct({
  teamId: S.String,
});

export const CreateOrganizationSchema = S.Struct({
  name: S.String.pipe(
    S.minLength(1, { message: () => 'Club name is required' }),
    S.minLength(3, {
      message: () => 'Club name must be at least 3 characters',
    }),
    S.maxLength(100, {
      message: () => 'Club name must be less than 100 characters',
    }),
  ),
  slug: S.String.pipe(
    S.minLength(1, { message: () => 'Club slug is required' }),
    S.minLength(3, {
      message: () => 'Club slug must be at least 3 characters',
    }),
    S.maxLength(50, {
      message: () => 'Club slug must be less than 50 characters',
    }),
    S.filter((slug) => /^[a-z0-9-]+$/.test(slug), {
      message: () =>
        'Club slug can only contain lowercase letters, numbers, and hyphens',
    }),
  ),
});
