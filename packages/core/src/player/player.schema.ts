import { Schema as S } from 'effect';
import {
  Base64IdSchema,
  JerseyNumberSchema as BaseJerseyNumberSchema,
  EmailSchema,
} from '../schema';

export const PlayerIdSchema = S.UUID.pipe(
  S.minLength(1, { message: () => 'Player ID is required' }),
);

// TODO: move these..
export const TeamIdSchema = Base64IdSchema('Team ID is required');

export const OrganizationIdSchema = Base64IdSchema(
  'Organization ID is required',
);

export const JerseyNumberSchema = S.NullOr(BaseJerseyNumberSchema);

export const PositionSchema = S.NullOr(S.String);

export const GetAllPlayersInputSchema = S.Struct({
  organizationId: OrganizationIdSchema,
});
export type GetAllPlayersInput = typeof GetAllPlayersInputSchema.Type;

export const CreatePlayerInputSchema = S.Struct({
  organizationId: OrganizationIdSchema,
  name: S.String,
  email: S.NullOr(EmailSchema),
  phone: S.NullOr(S.String),
  dateOfBirth: S.NullOr(S.String),
  userId: S.NullOr(S.String),
});
export type CreatePlayerInput = typeof CreatePlayerInputSchema.Type;

export const UpdatePlayerInputSchema = S.Struct({
  playerId: PlayerIdSchema,
  name: S.optional(S.NullOr(S.String)),
  email: S.optional(S.NullOr(EmailSchema)),
  phone: S.optional(S.NullOr(S.String)),
  dateOfBirth: S.optional(S.NullOr(S.String)),
});
export type UpdatePlayerInput = typeof UpdatePlayerInputSchema.Type;

export const UpdateTeamPlayerInputSchema = S.Struct({
  teamId: TeamIdSchema,
  playerId: PlayerIdSchema,
  jerseyNumber: S.optional(JerseyNumberSchema),
  position: S.optional(PositionSchema),
});
export type UpdateTeamPlayerInput = typeof UpdateTeamPlayerInputSchema.Type;

export const AddPlayerToTeamInputSchema = S.Struct({
  playerId: PlayerIdSchema,
  teamId: TeamIdSchema,
  jerseyNumber: JerseyNumberSchema,
  position: PositionSchema,
});
export type AddPlayerToTeamInput = typeof AddPlayerToTeamInputSchema.Type;

export const RemovePlayerFromTeamInputSchema = S.Struct({
  teamId: S.String,
  playerId: S.String,
});
export type RemovePlayerFromTeamInput =
  typeof RemovePlayerFromTeamInputSchema.Type;

export const DeletePlayerInputSchema = S.Struct({
  playerId: S.String,
});
export type DeletePlayerInput = typeof DeletePlayerInputSchema.Type;

export const BulkRemovePlayersFromTeamInputSchema = S.Struct({
  teamId: S.String,
  playerIds: S.Array(S.String),
});
export type BulkRemovePlayersFromTeamInput =
  typeof BulkRemovePlayersFromTeamInputSchema.Type;

export const BulkDeletePlayersInputSchema = S.Struct({
  playerIds: S.Array(S.String),
});
export type BulkDeletePlayersInput = typeof BulkDeletePlayersInputSchema.Type;
