export const secret = {
  GoogleAuthClientSecret: new sst.Secret('GoogleAuthClientSecret'),
  GoogleAuthClientId: new sst.Secret('GoogleAuthClientId'),
  BetterAuthSecret: new sst.Secret('BetterAuthSecret'),
  // POLAR_WEBHOOK_SECRET
  PlanetScaleHost: new sst.Secret('PlanetScaleHost'),
  PlanetScaleUsername: new sst.Secret('PlanetScaleUsername'),
  PlanetScalePassword: new sst.Secret('PlanetScalePassword'),
  DrizzleLog: new sst.Secret('DrizzleLog', 'false'),
};

export const allSecrets = Object.values(secret);
