export const secret = {
  ZeroAuthSecret: new sst.Secret('ZeroAuthSecret'),
  GeminiKey: new sst.Secret('GeminiKey'),
};

export const allSecrets = Object.values(secret);
