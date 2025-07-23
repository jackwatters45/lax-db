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
            input.stage === 'production' ? 'lax-db-production' : 'lax-db-dev',
        },
        cloudflare: '6.2.0',
        command: true,
      },
    };
  },
  async run() {
    const infra = await import('./infra');

    return {
      frontend: infra.frontend.url,
      vpc: infra.vpc.id,
      auth: infra.auth.url,
      storage: infra.bucket.name,
      databaseId: infra.database.id,
      databaseProxy: infra.database.proxyId,
      database: infra.database.getSSTLink(),
    };
  },
});
