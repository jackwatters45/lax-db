import { AuthService } from '@lax-db/core/auth';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { OrganizationIdSchema } from '@lax-db/core/schema';
import { useMutation } from '@tanstack/react-query';
import type { useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema } from 'effect';
import { toast } from 'sonner';
import { authMiddleware } from '@/lib/middleware';

// Mutation to switch organization
const SwitchActiveOrganizationSchema = Schema.Struct({
  ...OrganizationIdSchema,
});

const switchActiveOrganization = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof SwitchActiveOrganizationSchema.Type) =>
    Schema.decodeSync(SwitchActiveOrganizationSchema)(data)
  )
  .handler(async ({ data, context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService;
        const organization = yield* Effect.promise(() =>
          auth.auth.api.setActiveOrganization({
            headers: context.headers,
            body: {
              organizationId: data.organizationId,
            },
          })
        );

        return { organizationSlug: organization?.slug };
      })
    )
  );

type SwitchOrgMutation = {
  router: ReturnType<typeof useRouter>;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

export const useSwitchOrganization = ({ setOpen, router }: SwitchOrgMutation) =>
  useMutation({
    mutationFn: (organizationId: string) =>
      switchActiveOrganization({ data: { organizationId } }),
    onError: (_error) => {
      toast.error('Failed to switch organization');
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
