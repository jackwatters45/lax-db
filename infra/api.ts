export const api = new sst.aws.Function('Api', {
  url: true,
  handler: './packages/api/src/index.handler',
  link: [],
});
