/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'lax-db',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        aws: {
          region: 'us-west-2',
          profile:
            input.stage === 'production' ? 'laxdb-production' : 'laxdb-dev',
        },
        cloudflare: '6.6.0',
        command: true,
      },
    };
  },
  async run() {
    const infra = await import('./infra');

    return {
      databaseId: infra.database.id,
      databaseProxy: infra.database.proxyId,
      database: infra.database.getSSTLink(),
      redisClusterId: infra.redis.clusterId,
      storage: infra.bucket.name,
      vpc: infra.vpc.id,
      web: infra.web.url,
      email: infra.email.sender,
    };
  },
});
