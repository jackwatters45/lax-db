import { isPermanentStage } from './stage';
import { vpc } from './vpc';

export const redis = isPermanentStage
  ? new sst.aws.Redis('Redis', { vpc })
  : $dev
    ? new sst.aws.Redis('Redis', {
        vpc,
        dev: {
          host: 'localhost',
          port: 6379,
        },
      })
    : sst.aws.Redis.get('Redis', 'lax-db-dev-rediscluster-bhvocztt');
