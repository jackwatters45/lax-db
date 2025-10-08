import { secret } from './secret';
import { vpc } from './vpc';

export const database = new sst.Linkable('Database', {
  properties: {
    database: 'postgres',
    host: secret.PlanetScaleHost.value,
    username: secret.PlanetScaleUsername.value,
    password: secret.PlanetScalePassword.value,
    port: 6432,
  },
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
