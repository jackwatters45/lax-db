import { isPermanentStage } from './stage';

export const PRODUCTION = 'laxdb.io';
export const DEV = 'dev.laxdb.io';

export const permanentDomain = $app.stage === 'production' ? PRODUCTION : DEV;

export const domain =
  $app.stage === 'production'
    ? PRODUCTION
    : $app.stage === 'dev'
      ? DEV
      : `${$app.stage}.${DEV}`;

export function subdomain(name: string) {
  if (isPermanentStage) return `${name}.${domain}`;
  return `${name}-${domain}`;
}
