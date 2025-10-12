import { Schema } from 'effect';

export const CreateOrganizationSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Club name is required' }),
    Schema.minLength(3, {
      message: () => 'Club name must be at least 3 characters',
    }),
    Schema.maxLength(100, {
      message: () => 'Club name must be less than 100 characters',
    }),
  ),
  slug: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Club slug is required' }),
    Schema.minLength(3, {
      message: () => 'Club slug must be at least 3 characters',
    }),
    Schema.maxLength(50, {
      message: () => 'Club slug must be less than 50 characters',
    }),
    Schema.filter((slug) => /^[a-z0-9-]+$/.test(slug), {
      message: () =>
        'Club slug can only contain lowercase letters, numbers, and hyphens',
    }),
  ),
});
