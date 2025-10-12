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
