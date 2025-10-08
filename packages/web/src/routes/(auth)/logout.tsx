import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)/logout')({
  beforeLoad: async () => {
    const { auth } = await import('@lax-db/core/auth');
    const { getRequest } = await import('@tanstack/react-start/server');

    const request = getRequest();
    const { headers } = request;
    const session = await auth.api.getSession({ headers });
    if (!session) throw redirect({ to: '/login' });
    await auth.api.signOut({ headers });
    throw redirect({ to: '/' });
  },
});
