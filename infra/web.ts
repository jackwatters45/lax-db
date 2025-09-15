import { bucket } from './storage';

export const web = new sst.aws.TanStackStart('Web', {
  path: 'packages/web',
  link: [bucket],
});
