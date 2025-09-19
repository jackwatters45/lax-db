import {
  ac,
  assistantCoach,
  coach,
  headCoach,
  parent,
  player,
} from '@lax-db/core/auth/permissions';
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
      ac,
      roles: {
        headCoach,
        coach,
        assistantCoach,
        player,
        parent,
      },
      teams: {
        enabled: true,
      },
    }),
    lastLoginMethodClient(),
    adminClient(),
  ],
});
