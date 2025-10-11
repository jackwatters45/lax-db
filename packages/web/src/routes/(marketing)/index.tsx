import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/(marketing)/')({
  beforeLoad: async () => {
    const { getRequest } = await import('@tanstack/react-start/server');
    const { auth } = await import('@lax-db/core/auth');
    const request = getRequest();
    const { headers } = request;

    const session = await auth.api.getSession({ headers });

    if (!session) throw redirect({ to: '/login' });
    throw redirect({ to: '/redirect' });
  },
});
