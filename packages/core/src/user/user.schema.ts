import { Schema } from 'effect';

export class CreateInput extends Schema.Class<CreateInput>('CreateInput')({
  email: Schema.String,
  name: Schema.String,
}) {}

export class FromEmailInput extends Schema.Class<FromEmailInput>(
  'FromEmailInput',
)({
  email: Schema.String,
}) {}
