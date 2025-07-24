export const secret = {
  GoogleGenAIKey: new sst.Secret('GoogleGenAIKey'),
  // POLAR_WEBHOOK_SECRET
};

export const allSecrets = Object.values(secret);
