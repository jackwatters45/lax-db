import { isPermanentStage } from './stage';
import { vpc } from './vpc';

export const database = isPermanentStage
  ? new sst.aws.Postgres('Database', {
      vpc,
      proxy: true,
      version: '17.4',
    })
  : $dev
    ? new sst.aws.Postgres('Database', {
        vpc,
        proxy: true,
        version: '17.4',
        dev: {
          username: 'laxdb',
          password: 'laxdb_password',
          database: 'laxdb',
          port: 5432,
        },
      })
    : sst.aws.Postgres.get('Database', {
        id: 'goalbound-dev-databaseinstance-eddrmoxa',
        proxyId: 'goalbound-dev-databaseproxy-xbktaxsf',
      });



const migrator = new sst.aws.Function('DatabaseMigrator', {
  handler: 'packages/functions/src/drizzle/migrator.handler',
  link: [database],
  vpc,
  copyFiles: [
    {
      from: 'packages/core/migrations',
      to: './packages/core/migrations',
    },
  ],
});

if (!$dev) {
  new aws.lambda.Invocation('DatabaseMigratorInvocation', {
    input: Date.now().toString(),
    functionName: migrator.name,
  });
}

export const studio = new sst.x.DevCommand('Studio', {
  link: [database],
  dev: {
    autostart: true,
    command: 'npx drizzle-kit studio',
    directory: 'packages/core',
  },
});

// Register the sync-pipeline script as a DevCommand for local development
export const syncPipeline = new sst.x.DevCommand('db:sync-pipeline', {
  link: [database],
  dev: {
    autostart: false,
    command: 'bun run packages/scripts/src/sync-pipeline.ts',
    directory: '.',
  },
});
