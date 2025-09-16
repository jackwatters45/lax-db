export const secret = {
  GoogleAuthClientSecret: new sst.Secret('GoogleAuthClientSecret'),
  GoogleAuthClientId: new sst.Secret('GoogleAuthClientId'),
  BetterAuthSecret: new sst.Secret('BetterAuthSecret'),
  // POLAR_WEBHOOK_SECRET
};

export const allSecrets = Object.values(secret);
