import { auth } from './auth';

new sst.aws.Function('Api', {
  url: true,
  handler: './packages/api/src/index.handler',
  link: [auth],
});
