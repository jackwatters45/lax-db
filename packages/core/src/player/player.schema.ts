import { Schema as S } from 'effect';
import {
  JerseyNumberSchema as BaseJerseyNumberSchema,
  EmailSchema,
  NullablePlayerNameSchema,
  OrganizationIdSchema,
  PlayerIdSchema,
  PlayerNameSchema,
  TeamIdSchema,
} from '../schema';

export const JerseyNumberSchema = S.NullOr(BaseJerseyNumberSchema);

export const PositionSchema = S.NullOr(S.String);

export class GetAllPlayersInput extends S.Class<GetAllPlayersInput>(
  'GetAllPlayersInput',
)({
  ...OrganizationIdSchema,
}) {}

export class CreatePlayerInput extends S.Class<CreatePlayerInput>(
  'CreatePlayerInput',
)({
  ...OrganizationIdSchema,
  name: PlayerNameSchema,
  email: S.NullOr(EmailSchema),
  phone: S.NullOr(S.String),
  dateOfBirth: S.NullOr(S.String),
  userId: S.NullOr(S.String),
}) {}

export class GetTeamPlayersInput extends S.Class<GetTeamPlayersInput>(
  'GetTeamPlayersInput',
)({
  ...TeamIdSchema,
}) {}

export class UpdatePlayerInput extends S.Class<UpdatePlayerInput>(
  'UpdatePlayerInput',
)({
  ...PlayerIdSchema,
  name: S.optional(NullablePlayerNameSchema),
  email: S.optional(S.NullOr(EmailSchema)),
  phone: S.optional(S.NullOr(S.String)),
  dateOfBirth: S.optional(S.NullOr(S.String)),
}) {}

export class UpdateTeamPlayerInput extends S.Class<UpdateTeamPlayerInput>(
  'UpdateTeamPlayerInput',
)({
  ...TeamIdSchema,
  ...PlayerIdSchema,
  jerseyNumber: S.optional(JerseyNumberSchema),
  position: S.optional(PositionSchema),
}) {}

export class AddNewPlayerToTeamInput extends S.Class<AddNewPlayerToTeamInput>(
  'AddNewPlayerToTeamInput',
)({
  ...TeamIdSchema,
  jerseyNumber: JerseyNumberSchema,
  position: PositionSchema,
}) {}

export class AddPlayerToTeamInput extends S.Class<AddPlayerToTeamInput>(
  'AddPlayerToTeamInput',
)({
  ...PlayerIdSchema,
  ...TeamIdSchema,
  jerseyNumber: JerseyNumberSchema,
  position: PositionSchema,
}) {}

export class RemovePlayerFromTeamInput extends S.Class<RemovePlayerFromTeamInput>(
  'RemovePlayerFromTeamInput',
)({
  teamId: S.String,
  playerId: S.String,
}) {}

export class DeletePlayerInput extends S.Class<DeletePlayerInput>(
  'DeletePlayerInput',
)({
  playerId: S.String,
}) {}

export class BulkRemovePlayersFromTeamInput extends S.Class<BulkRemovePlayersFromTeamInput>(
  'BulkRemovePlayersFromTeamInput',
)({
  teamId: S.String,
  playerIds: S.Array(S.String),
}) {}

export class BulkDeletePlayersInput extends S.Class<BulkDeletePlayersInput>(
  'BulkDeletePlayersInput',
)({
  playerIds: S.Array(S.String),
}) {}
