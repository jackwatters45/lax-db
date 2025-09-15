import { Schema } from 'effect';

export const PlayerStats = Schema.Struct({
  playerName: Schema.String,
  playerUrl: Schema.optional(Schema.String),
  team: Schema.String,
  teamUrl: Schema.optional(Schema.String),
  matches: Schema.Number,
  lastMatchDate: Schema.String,
  totalAssists: Schema.String,
  totalScore: Schema.Number,
  highestScore: Schema.Number,
  highestScoreDate: Schema.String,
  highestScoreOpponent: Schema.String,
  highestScoreVenue: Schema.String,
});

export type PlayerStats = typeof PlayerStats.Type;

export const PlayerStatsArray = Schema.Array(PlayerStats);

export const ScrapedData = Schema.Struct({
  competitionId: Schema.String,
  poolId: Schema.String,
  roundId: Schema.String,
  scrapedAt: Schema.String,
  players: PlayerStatsArray,
});

export type ScrapedData = typeof ScrapedData.Type;
