
// export const vpc = isPermanentStage
//   ? new sst.aws.Vpc('Vpc', { bastion: true })
//   : sst.aws.Vpc.get('Vpc', 'vpc-0f789f161e4578046');

export const vpc = new sst.aws.Vpc('Vpc', { bastion: true, nat: 'ec2' });
