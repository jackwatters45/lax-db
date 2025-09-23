import { auth } from '@lax-db/core/auth';
import { createServerFileRoute } from '@tanstack/react-start/server';

export const ServerRoute = createServerFileRoute(
  '/api/redirect-to-org',
).methods({
  GET: async ({ request }) => {
    try {
      // Get session from the request
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/login',
          },
        });
      }

      // Get user's active organization
      const activeOrg = await auth.api.getFullOrganization({
        headers: request.headers,
      });

      if (!activeOrg) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/organizations/create',
          },
        });
      }

      // Redirect to the organization's dashboard
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/${activeOrg.slug}`,
        },
      });
    } catch (error) {
      console.error('Error in redirect-to-org:', error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/login',
        },
      });
    }
  },
});
