import { isPermanentStage } from './stage';

export const vpc = isPermanentStage
  ? new sst.aws.Vpc('Vpc', { bastion: true, nat: 'ec2' })
  : sst.aws.Vpc.get('Vpc', 'vpc-0246df0ddfa06604f');
