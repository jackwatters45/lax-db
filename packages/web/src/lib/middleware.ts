import { createMiddleware } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';

export const authMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next }) => {
  const { auth } = await import('@lax-db/core/auth');
  const { headers } = getWebRequest();

  const session = await auth.api.getSession({ headers });

  return next({
    context: {
      session,
      headers,
    },
  });
});

export const protectedMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next }) => {
  const { auth } = await import('@lax-db/core/auth');
  const { headers } = getWebRequest();

  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw new Error('Unauthorized');
  }

  return next({
    context: {
      session,
      headers,
    },
  });
});
