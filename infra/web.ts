import { bucket } from './storage';

export const frontend = new sst.aws.TanStackStart('Frontend', {
  path: 'packages/frontend',
  link: [bucket],
});
