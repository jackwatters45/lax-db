import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { authMiddleware } from '@/lib/middleware';

const getUser = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => context.session.user);

export const Route = createFileRoute('/')({
  component: RouteComponent,
  beforeLoad: async () => {
    const user = await getUser();

    if (!user) redirect({ to: '/login' });
  },
});

function RouteComponent() {
  return <div>Hello "/"!</div>;
}
