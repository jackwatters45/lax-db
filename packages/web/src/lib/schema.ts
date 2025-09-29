import { Schema } from 'effect';

export const TeamIdSchema = Schema.Struct({
  teamId: Schema.String,
});
