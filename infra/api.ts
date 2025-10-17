import { database } from './database';
import { domain } from './dns';
import { redis } from './redis';
import { allSecrets } from './secret';
import { vpc } from './vpc';

const cluster = new sst.aws.Cluster('MyCluster', { vpc });

export const api = new sst.aws.Service('Api', {
  link: [database, redis, ...allSecrets],
  cluster,
  loadBalancer: {
    domain: {
      name: domain,
      dns: sst.cloudflare.dns(),
    },
    rules: [{ listen: '80/http', forward: '3001/http' }],
  },
  dev: {
    autostart: true,
    directory: 'packages/api',
    command: 'bun dev',
  },
});
