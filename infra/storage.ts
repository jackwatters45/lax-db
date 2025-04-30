
// export const bucket = isPermanentStage
//   ? new sst.aws.Bucket('Bucket', {
//       access: 'public',
//     })
//   : sst.aws.Bucket.get('Bucket', 'goalbound-dev-bucketbucket-hnvevbtm');

export const bucket = new sst.aws.Bucket('Bucket', {
  access: 'public',
});
