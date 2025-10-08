import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const AcceptInvitationSchema = S.Struct({
  invitationId: S.String.pipe(
    S.minLength(1, { message: () => 'Invitation code is required' }),
    S.minLength(10, {
      message: () => 'Invitation code must be at least 10 characters',
    }),
  ),
});
type FormData = typeof AcceptInvitationSchema.Type;

const acceptInvitation = createServerFn({ method: 'POST' })
  .inputValidator((data: typeof AcceptInvitationSchema.Type) =>
    S.decodeSync(AcceptInvitationSchema)(data),
  )
  .handler(async ({ data }) => {
    const { OrganizationAPI } = await import('@lax-db/core/organization/index');
    const { getRequest } = await import('@tanstack/react-start/server');

    const request = getRequest();
    return await OrganizationAPI.acceptInvitation(data, request.headers);
  });

export const Route = createFileRoute('/_protected/organizations/join')({
  component: JoinOrganizationPage,
});

function JoinOrganizationPage() {
  // const router = useRouter();

  const form = useForm<FormData>({
    resolver: effectTsResolver(AcceptInvitationSchema),
    defaultValues: {
      invitationId: '',
    },
  });

  // Use React Query mutation for joining organization
  const joinOrgMutation = useMutation({
    mutationKey: ['acceptInvitation'],
    mutationFn: (data: FormData) => acceptInvitation({ data }),
    onSuccess: () => {
      toast.success('Successfully joined the organization!');
      // router.navigate({
      //   to: '/$organizationSlug',
      //   params: { organizationSlug },
      // });
    },
    onError: (error) => {
      toast.error(
        'Failed to join organization. Please check your invitation code.',
      );
      console.error('Join organization error:', error);
    },
  });

  const onSubmit = (data: FormData) => {
    joinOrgMutation.mutate(data);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Join Athletic Club</h1>
        <p className="text-muted-foreground">
          Enter the invitation code you received to join an existing club
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Join Organization</CardTitle>
          <p className="text-muted-foreground text-sm">
            You should have received an invitation code via email from your club
            administrator
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="invitationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invitation Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your invitation code"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This is usually a long string of letters and numbers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={joinOrgMutation.isPending}
                  className="flex-1"
                >
                  {joinOrgMutation.isPending ? 'Joining...' : 'Join Club'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
