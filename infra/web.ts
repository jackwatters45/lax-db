import { database } from './database';
import { domain } from './dns';
import { redis } from './redis';
import { allSecrets } from './secret';
import { bucket } from './storage';
import { vpc } from './vpc';

export const web = new sst.aws.TanStackStart('Web', {
  path: 'packages/web',
  vpc: vpc,
  domain: {
    name: domain,
    redirects: [`www.${domain}`],
    dns: sst.cloudflare.dns({}),
  },
  link: [bucket, database, redis, ...allSecrets],
});
