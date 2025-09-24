import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { authMiddleware } from '@/lib/middleware';

const getSession = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => context.session?.user);

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const user = await getSession();

    if (!user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      });
    }

    return {
      user,
    };
  },
});
