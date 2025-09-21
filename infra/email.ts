import { domain } from './dns';

export const supportEmail = `support@${domain}`;
export const noReplyEmail = `noreply@${domain}`;

export const email = new sst.aws.Email('Email', {
  sender: domain,
  dns: sst.cloudflare.dns(),
});
