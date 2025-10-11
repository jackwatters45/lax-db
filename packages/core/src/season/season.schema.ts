import { Schema } from 'effect';
import { IdsSchema, TimestampsSchema } from '../schema';

export class Season extends Schema.Class<Season>('Season')({
  ...IdsSchema,
  ...TimestampsSchema,
}) {}

export class GetSeasonInputSchema extends Schema.Class<GetSeasonInputSchema>(
  'GetSeasonInputSchema',
)({
  publicId: IdsSchema.publicId,
}) {}
