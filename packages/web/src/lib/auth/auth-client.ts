import { polarClient } from '@polar-sh/better-auth';
import {
  adminClient,
  lastLoginMethodClient,
  organizationClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  plugins: [
    polarClient(),
    organizationClient({
      teams: {
        enabled: true,
      },
    }),
    lastLoginMethodClient(),
    adminClient(),
  ],
});
