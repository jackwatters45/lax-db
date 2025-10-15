// ---------------------------------------------
// Schemas (Shared across RPC and HTTP API)
// These are protocol-agnostic data definitions
// ---------------------------------------------

import { Schema } from 'effect';

export class Game extends Schema.Class<Game>('Game')({
  id: Schema.Number,
  name: Schema.String,
  date: Schema.DateTimeUtc,
}) {}
