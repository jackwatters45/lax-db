import { Schema } from 'effect';
import {
  IdsSchema,
  NullableTeamIdSchema,
  OrganizationIdSchema,
  TeamIdSchema,
  TimestampsSchema,
} from '../schema';

export class Season extends Schema.Class<Season>('Season')({
  ...IdsSchema,
  ...TimestampsSchema,
}) {}

export class GetAllSeasonsInput extends Schema.Class<GetAllSeasonsInput>(
  'GetAllSeasonsInput',
)({
  ...OrganizationIdSchema,
  ...NullableTeamIdSchema,
}) {}

export class GetSeasonInput extends Schema.Class<GetSeasonInput>(
  'GetSeasonInput',
)({
  ...OrganizationIdSchema,
  ...NullableTeamIdSchema,
  publicId: IdsSchema.publicId,
}) {}

export class CreateSeasonInput extends Schema.Class<CreateSeasonInput>(
  'CreateSeasonInput',
)({
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Season name is required' }),
    Schema.maxLength(100, {
      message: () => 'Season name must be 100 characters or less',
    }),
    Schema.trimmed(),
  ),
  startDate: Schema.DateFromSelf,
  endDate: Schema.NullOr(Schema.DateFromSelf),
  status: Schema.Literal('active', 'completed', 'upcoming').pipe(
    Schema.optional,
  ),
  division: Schema.NullOr(Schema.String),
}) {}

export class UpdateSeasonInput extends Schema.Class<UpdateSeasonInput>(
  'UpdateSeasonInput',
)({
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  publicId: IdsSchema.publicId,
}) {}

export class DeleteSeasonInput extends Schema.Class<DeleteSeasonInput>(
  'DeleteSeasonInput',
)({
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  publicId: IdsSchema.publicId,
}) {}
