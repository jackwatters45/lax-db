import { Schema } from 'effect';
import { IdsSchema, OrganizationIdSchema, TimestampsSchema } from '../schema';

export class Game extends Schema.Class<Game>('Game')({
  ...IdsSchema,
  ...TimestampsSchema,
}) {}

export class GetAllGamesInputSchema extends Schema.Class<GetAllGamesInputSchema>(
  'GetAllGamesInputSchema',
)({
  ...OrganizationIdSchema,
}) {}

export class GetGameInputSchema extends Schema.Class<GetGameInputSchema>(
  'GetGameInputSchema',
)({
  publicId: IdsSchema.publicId,
}) {}
