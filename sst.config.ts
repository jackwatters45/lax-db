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
        cloudflare: '6.2.0',
        command: true,
      },
    };
  },
  async run() {
    const _infra = await import('./infra');

    return {};
  },
});
