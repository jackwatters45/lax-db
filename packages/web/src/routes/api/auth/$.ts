import { auth } from '@lax-db/core/auth';
import { createServerFileRoute } from '@tanstack/react-start/server';

export const ServerRoute = createServerFileRoute('/api/auth/$').methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);

    // Handle OAuth callback specifically
    if (url.pathname === '/api/auth/callback') {
      try {
        // First handle the OAuth callback
        const response = await auth.handler(request);

        // If successful redirect, check if we need to redirect to org
        if (response.status === 302) {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (session?.user) {
            const activeOrg = await auth.api.getFullOrganization({
              headers: request.headers,
            });

            if (activeOrg) {
              return new Response(null, {
                status: 302,
                headers: {
                  Location: `/${activeOrg.slug}`,
                },
              });
            }
            return new Response(null, {
              status: 302,
              headers: {
                Location: '/organizations/create',
              },
            });
          }
        }

        return response;
      } catch (error) {
        console.error('Error in auth callback:', error);
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/login',
          },
        });
      }
    }

    // Default auth handler for other routes
    return auth.handler(request);
  },
  POST: ({ request }) => {
    return auth.handler(request);
  },
});
