import { OrganizationIdSchema } from '@lax-db/core/schema';
import { useMutation } from '@tanstack/react-query';
import type { useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
import { toast } from 'sonner';
import { authMiddleware } from '@/lib/middleware';

// Mutation to switch organization
const SwitchActiveOrganizationSchema = S.Struct({
  ...OrganizationIdSchema,
});

const switchActiveOrganization = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof SwitchActiveOrganizationSchema.Type) =>
    S.decodeSync(SwitchActiveOrganizationSchema)(data),
  )
  .handler(async ({ data, context }) => {
    const { auth } = await import('@lax-db/core/auth');

    const organization = await auth.api.setActiveOrganization({
      headers: context.headers,
      body: {
        organizationId: data.organizationId,
      },
    });

    return { organizationSlug: organization?.slug };
  });

type SwitchOrgMutation = {
  router: ReturnType<typeof useRouter>;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

export const useSwitchOrganization = ({ setOpen, router }: SwitchOrgMutation) =>
  useMutation({
    mutationFn: (organizationId: string) =>
      switchActiveOrganization({ data: { organizationId } }),
    onError: (error) => {
      toast.error('Failed to switch organization');
      console.error('Switch organization error:', error);
    },
    onSuccess: (data, _variables, _result, context) => {
      context.client.invalidateQueries();

      // router.navigate({ to: `/${newOrg.slug}` });

      // toast.success('Organization switched successfully');
      if (setOpen) {
        setOpen(false);
      }
      router.navigate({ to: `/${data.organizationSlug}` });
    },
  });

// // // Mutation to switch organization
// const useSwitchOrganization2 = () =>
//   useMutation({
//     mutationFn: (organizationId: string) =>
//       switchActiveOrganization({ data: { organizationId } }),
//     onError: (error) => {
//       toast.error('Failed to switch organization');
//       console.error('Switch organization error:', error);
//     },
//     onSuccess: (_data, organizationId, _result, context) => {
//       context.client.invalidateQueries();
//       toast.success('Organization switched successfully');

//       router.navigate({ to: `/${data.organizationSlug}` });
//     },
//   });
