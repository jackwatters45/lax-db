import { database } from './database';
import { domain } from './dns';
import { email, noReplyEmail, supportEmail } from './email';
import { redis } from './redis';
import { allSecrets } from './secret';
import { bucket } from './storage';
import { vpc } from './vpc';

const webDomain = `app.${domain}`;

export const web = new sst.aws.TanStackStart('Web', {
  path: 'packages/web',
  vpc,
  domain: {
    name: webDomain,
    redirects: [`www.${webDomain}`],
    dns: sst.cloudflare.dns(),
  },
  link: [bucket, database, email, redis, ...allSecrets],
  environment: {
    SENDER: noReplyEmail,
    SUPPORT_EMAIL: supportEmail,
  },
});
