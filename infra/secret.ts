export const secret = {
  ZeroAuthSecret: new sst.Secret('ZeroAuthSecret'),
  GoogleGenAIKey: new sst.Secret('GoogleGenAIKey'),
};

export const allSecrets = Object.values(secret);
