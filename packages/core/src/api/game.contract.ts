import { Schema } from 'effect';
import { NotFoundError, ValidationError } from '../error';
import { Game } from './game.schema';

export const GameErrors = Schema.Union(NotFoundError, ValidationError);

export const GameContract = {
  list: {
    success: Schema.Array(Game),
    error: GameErrors,
  },
  getById: {
    success: Game,
    error: GameErrors,
    payload: Schema.Struct({ id: Schema.Number }),
    path: Schema.Struct({ id: Schema.NumberFromString }),
  },
} as const;
