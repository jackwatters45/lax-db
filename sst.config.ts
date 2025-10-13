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
      database: infra.database.getSSTLink(),
      redisClusterId: infra.redis.clusterId,
      storage: infra.bucket.name,
      vpc: infra.vpc.id,
      web: infra.web.url,
      email: infra.email.sender,
    };
  },
});
