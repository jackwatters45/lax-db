import { Schema } from 'effect';
import {
  IdsSchema,
  NullableTeamIdSchema,
  OrganizationIdSchema,
  TeamIdSchema,
  TimestampsSchema,
} from '../schema';

export class Game extends Schema.Class<Game>('Game')({
  ...IdsSchema,
  ...TimestampsSchema,
}) {}

export class GetAllGamesInput extends Schema.Class<GetAllGamesInput>(
  'GetAllGamesInput',
)({
  ...OrganizationIdSchema,
  ...NullableTeamIdSchema,
}) {}

export class GetGameInput extends Schema.Class<GetGameInput>('GetGameInput')({
  ...OrganizationIdSchema,
  ...NullableTeamIdSchema,
  publicId: IdsSchema.publicId,
}) {}

export class CreateGameInput extends Schema.Class<CreateGameInput>(
  'CreateGameInput',
)({
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  opponentName: Schema.String.pipe(Schema.minLength(2)).pipe(
    Schema.maxLength(100),
  ),
}) {}

export class UpdateGameInput extends Schema.Class<UpdateGameInput>(
  'UpdateGameInput',
)({
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  publicId: IdsSchema.publicId,
}) {}

export class DeleteGameInput extends Schema.Class<DeleteGameInput>(
  'DeleteGameInput',
)({
  ...OrganizationIdSchema,
  ...TeamIdSchema,
  publicId: IdsSchema.publicId,
}) {}
