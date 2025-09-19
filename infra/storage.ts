import { isPermanentStage } from './stage';

export const bucket = isPermanentStage
  ? new sst.aws.Bucket('Bucket', {
      access: 'public',
    })
  : sst.aws.Bucket.get('Bucket', 'lax-db-dev-bucketbucket-bwowzknh');
