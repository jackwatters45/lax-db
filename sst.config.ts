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
        planetscale: '0.4.1',
        command: true,
        cloudflare: '6.10.0',
      },
    };
  },
  async run() {
    const infra = await import('./infra');
    return {
      vpc: infra.vpc.id,
      database: infra.database.getSSTLink(),
      redisClusterId: infra.redis.clusterId,
      api: infra.api.url,
      web: infra.web.url,
      storage: infra.bucket.name,
      email: infra.email.sender,
    };
  },
});
