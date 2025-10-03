import { redirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';

export const authMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next }) => {
  const { auth } = await import('@lax-db/core/auth');
  const request = getWebRequest();
  const { headers } = request;

  const session = await auth.api.getSession({ headers });

  if (!session) {
    const url = new URL(request.url);
    throw redirect({
      to: '/login',
      search: {
        redirectUrl: url.pathname,
      },
    });
  }

  return next({
    context: {
      session,
      headers,
    },
  });
});
