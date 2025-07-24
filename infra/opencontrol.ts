import { database } from './database';
import { allSecrets } from './secret';

const opencontrol = new sst.aws.OpenControl('OpenControl', {
  server: {
    handler: 'packages/backend/src/function/opencontrol/server.handler',
    timeout: '3 minutes',
    link: [database, ...allSecrets],
    transform: {
      role: (args) => {
        args.managedPolicyArns = $output(args.managedPolicyArns).apply((v) => [
          ...(v ?? []),
          'arn:aws:iam::aws:policy/ReadOnlyAccess',
        ]);
      },
    },
  },
});

new sst.aws.Router('OpenControlRouter', {
  routes: {
    '/*': opencontrol.url,
  },
  // domain: { name: `opencontrol.${permanentDomain}`, dns: sst.cloudflare.dns() },
});
