import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/redirect')({
  beforeLoad: async ({ context }) => {
    const organizationSlug = context.activeOrganization?.slug;

    if (!organizationSlug) {
      throw redirect({
        to: '/organizations/create',
      });
    }

    throw redirect({
      to: '/$organizationSlug',
      params: { organizationSlug },
    });
  },
});
