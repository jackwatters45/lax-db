export const secret = {
  // google
  GoogleAuthClientSecret: new sst.Secret('GoogleAuthClientSecret'),
  GoogleAuthClientId: new sst.Secret('GoogleAuthClientId'),
  // better auth
  BetterAuthSecret: new sst.Secret('BetterAuthSecret'),
  // polar
  PolarAccessToken: new sst.Secret('PolarAccessToken'),
  PolarWebhookSecret: new sst.Secret('PolarWebhookSecret'),
  // planet scale
  PlanetScaleHost: new sst.Secret('PlanetScaleHost'),
  PlanetScaleUsername: new sst.Secret('PlanetScaleUsername'),
  PlanetScalePassword: new sst.Secret('PlanetScalePassword'),
  // random
  Stage: new sst.Secret('Stage', $app.stage),
  DrizzleLog: new sst.Secret('DrizzleLog', 'false'),
  DefaultAwsRegion: new sst.Secret('DefaultAwsRegion', 'us-west-2'),
};

export const allSecrets = Object.values(secret);
