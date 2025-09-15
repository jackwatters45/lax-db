import { FetchHttpClient } from '@effect/platform';
import { layerFileSystem } from '@effect/platform/KeyValueStore';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Console, Effect, Layer, Logger, LogLevel } from 'effect';
import { ScraperService, ScraperServiceLive } from './scraper.service';

const program = Effect.gen(function* () {
  const scraper = yield* ScraperService;

  // Scrape player stats for the given competition
  const result = yield* scraper.scrapePlayerStats(
    '0-1064-0-646412-0',
    '1001',
    '0',
  );

  yield* Console.log(`Successfully scraped ${result.players.length} players`);
  yield* Console.log(
    'Sample data:',
    JSON.stringify(result.players.slice(0, 3), null, 2),
  );

  return result;
});

const MainLayer = ScraperServiceLive.pipe(
  Layer.provide(
    Layer.mergeAll(
      FetchHttpClient.layer,
      layerFileSystem('./.kv-store').pipe(Layer.provide(NodeContext.layer)),
    ),
  ),
);

NodeRuntime.runMain(
  program.pipe(
    Effect.provide(MainLayer),
    Logger.withMinimumLogLevel(LogLevel.Info),
  ),
);

// https://websites.mygameday.app/comp_info.cgi?c=0-1064-0-646412-0&pool=1001&round=0&a=FIXTURE
// https://websites.mygameday.app/comp_info.cgi?c=0-1064-0-646412-0&pool=1001&a=LADDER\
// https://websites.mygameday.app/comp_info.cgi?c=0-1064-0-646412-0&pool=1001&round=0&a=STATS
