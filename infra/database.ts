import { vpc } from './vpc';

// export const database = isPermanentStage
//   ? new sst.aws.Postgres('Database', {
//       vpc,
//       proxy: true,
//     })
//   : sst.aws.Postgres.get('Database', {
//       id: 'goalbound-dev-databaseinstance-cnssdunx',
//       proxyId: 'goalbound-dev-databaseproxy-bdhmbwuo',
//     });

export const database = new sst.aws.Postgres('Database', {
  vpc,
  proxy: true,
  dev: {
    username: 'goalbound',
    password: 'goalbound_password',
    database: 'goalbound',
    port: 5432,
  },
});

export const studio = new sst.x.DevCommand('Studio', {
  link: [database],
  dev: {
    autostart: true,
    command: 'npx drizzle-kit studio',
    directory: 'packages/core',
  },
});

// const migrator = new sst.aws.Function('DatabaseMigrator', {
//   handler: 'src/migrator.handler',
//   link: [database],
//   vpc,
//   copyFiles: [
//     {
//       from: 'migrations',
//       to: './migrations',
//     },
//   ],
// });

// if (!$dev) {
//   new aws.lambda.Invocation('DatabaseMigratorInvocation', {
//     input: Date.now().toString(),
//     functionName: migrator.name,
//   });
// }
