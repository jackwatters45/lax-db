import { domain } from './dns';

export const marketing = new sst.aws.Nextjs('Marketing', {
  domain: {
    name: domain,
    redirects: [`www.${domain}`],
    dns: sst.cloudflare.dns({}),
  },
  link: [],
  environment: {},
  path: 'packages/marketing',
});
