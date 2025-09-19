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
        id: 'lax-db-dev-databaseinstance-tsvdrfux',
        proxyId: 'lax-db-dev-databaseproxy-bccuvdtd',
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
