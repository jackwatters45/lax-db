import { Schema } from 'effect';

// Drizzle Schemas
export const SerialSchema = Schema.Number.pipe(
  Schema.int({ message: () => 'ID must be a whole number' }),
  Schema.greaterThanOrEqualTo(0, {
    message: () => 'ID must be 0 or greater',
  }),
);
export const NanoidSchema = Schema.String.pipe(
  Schema.length(12),
  Schema.pattern(/^[A-Za-z0-9_-]{12}$/, {
    message: () => 'Invalid nanoid format',
  }),
);

export const IdsSchema = {
  id: SerialSchema,
  publicId: NanoidSchema,
};

export const CreatedAtSchema = Schema.DateFromSelf;
export const UpdatedAtSchema = Schema.NullOr(Schema.DateFromSelf);
export const DeletedAtSchema = Schema.NullOr(Schema.DateFromSelf);

export const TimestampsSchema = {
  createdAt: CreatedAtSchema,
  updatedAt: UpdatedAtSchema,
  deletedAt: DeletedAtSchema,
};

// Better Auth Schema
export const Base64IdSchema = (msg?: string) =>
  Schema.String.pipe(
    Schema.pattern(/^[a-zA-Z0-9]{32}$/, {
      message: () => msg ?? 'Invalid Base64 ID format',
    }),
  );

// Common Schemas
export const PlayerIdSchema = {
  playerId: Schema.UUID.pipe(
    Schema.minLength(1, { message: () => 'Player ID is required' }),
  ),
};

export const OrganizationSlugSchema = {
  organizationSlug: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Organization slug is required' }),
  ),
};

const TeamId = Base64IdSchema('Team ID is required');
export const TeamIdSchema = { teamId: TeamId };
export const NullableTeamIdSchema = { teamId: Schema.NullOr(TeamId) };

export const OrganizationIdSchema = {
  organizationId: Base64IdSchema('Organization ID is required'),
};

export const JerseyNumberSchema = Schema.Number.pipe(
  Schema.int({ message: () => 'Jersey number must be a whole number' }),
  Schema.greaterThanOrEqualTo(0, {
    message: () => 'Jersey number must be 0 or greater',
  }),
  Schema.lessThanOrEqualTo(1000, {
    message: () => 'Jersey number must be 1000 or less',
  }),
);
export const NullableJerseyNumberSchema = Schema.NullOr(JerseyNumberSchema);

export const EmailSchema = Schema.String.pipe(
  Schema.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: () => 'Please enter a valid email address',
  }),
);
export const NullableEmailSchema = Schema.NullOr(Schema.String);

export const PlayerNameSchema = Schema.String.pipe(
  Schema.minLength(1, {
    message: () => 'Player name must be at least 1 character',
  }),
  Schema.maxLength(100, {
    message: () => 'Player name must be 100 characters or less',
  }),
  Schema.trimmed(),
);
export const NullablePlayerNameSchema = Schema.NullOr(PlayerNameSchema);
