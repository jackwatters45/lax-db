import { auth } from '@lax-db/core/auth';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import type { Organization } from 'better-auth/plugins';
import { authMiddleware } from '@/lib/middleware';

const getSessionAndOrg = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    let activeOrganization: Organization | undefined | null;

    try {
      activeOrganization = await auth.api.getFullOrganization({
        headers: context.headers,
      });
    } catch (error) {
      console.log('ERRRRR');
      console.error(error);
    }

    if (!activeOrganization) {
      const orgs = await auth.api.listOrganizations({
        headers: context.headers,
      });

      activeOrganization = orgs.at(0);
    }

    return {
      user: context.session.user,
      session: context.session.session,
      activeOrganization,
    };
  });

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const sessionAndOrg = await getSessionAndOrg();

    // If no organization at all, redirect to create one
    if (!sessionAndOrg.activeOrganization) {
      throw redirect({
        to: '/organizations/create',
        search: {
          redirectUrl: location.href,
        },
      });
    }

    return sessionAndOrg;
  },
});
