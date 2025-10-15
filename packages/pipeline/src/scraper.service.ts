import { HttpClient } from '@effect/platform';
import { KeyValueStore } from '@effect/platform/KeyValueStore';
import * as cheerio from 'cheerio';
import { Context, Effect, Layer, Schema } from 'effect';
import type { PlayerStats } from './schemas';
import { ScrapedData } from './schemas';

export class ScraperService extends Context.Tag('ScraperService')<
  ScraperService,
  {
    readonly scrapePlayerStats: (
      competitionId: string,
      poolId: string,
      roundId: string
    ) => Effect.Effect<ScrapedData, Error>;
  }
>() {}

export const ScraperServiceLive = Layer.effect(
  ScraperService,
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const kv = yield* KeyValueStore;
    const schemaStore = kv.forSchema(ScrapedData);

    const scrapePlayerStats = (
      competitionId: string,
      poolId: string,
      roundId: string
    ) =>
      Effect.gen(function* () {
        const url = `https://websites.mygameday.app/comp_info.cgi?c=${competitionId}&pool=${poolId}&round=${roundId}&a=STATS`;

        const response = yield* client.get(url);
        const text = yield* response.text;

        const $ = cheerio.load(text);
        const $table = $('table.stats-table');
        const $tbody = $table.find('tbody');
        const $trs = $tbody.find('tr');

        const players: PlayerStats[] = $trs
          .map((_index, row) => {
            const $row = $(row);
            const $cells = $row.find('td');

            return {
              playerName: $cells.eq(0).text().trim(),
              playerUrl: $cells.eq(0).find('a').attr('href'),
              team: $cells.eq(1).text().trim(),
              teamUrl: $cells.eq(1).find('a').attr('href'),
              matches: Number.parseInt($cells.eq(2).text(), 10) || 0,
              lastMatchDate: $cells.eq(3).text().trim(),
              totalAssists: $cells.eq(4).text().trim() || '0',
              totalScore: Number.parseInt($cells.eq(5).text(), 10) || 0,
              highestScore: Number.parseInt($cells.eq(6).text(), 10) || 0,
              highestScoreDate: $cells.eq(7).text().trim(),
              highestScoreOpponent: $cells.eq(8).text().trim(),
              highestScoreVenue: $cells.eq(9).text().trim(),
            };
          })
          .get();

        const scrapedData = {
          competitionId,
          poolId,
          roundId,
          scrapedAt: new Date().toISOString(),
          players,
        };

        const validated = yield* Schema.decode(ScrapedData)(scrapedData);

        const key = `stats:${competitionId}:${poolId}:${roundId}`;
        yield* schemaStore.set(key, validated);

        return validated;
      }).pipe(Effect.mapError((error) => new Error(String(error))));

    return { scrapePlayerStats };
  })
);
