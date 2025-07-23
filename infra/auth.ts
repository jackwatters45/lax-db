import { database } from './database';
import { allSecrets } from './secret';
import { vpc } from './vpc';
import { DEV, PRODUCTION } from './dns';

const domain =
  $app.stage === 'production'
    ? `auth-${PRODUCTION}`
    : `${$app.stage}-auth.${DEV}`;

export const auth = new sst.aws.Auth('Auth', {
  forceUpgrade: 'v2',
  issuer: {
    vpc: vpc,
    link: [database, ...allSecrets],
    handler: './packages/functions/src/auth/index.handler',
  },
  domain: {
    name: domain,
    dns: sst.cloudflare.dns(),
  },
});
