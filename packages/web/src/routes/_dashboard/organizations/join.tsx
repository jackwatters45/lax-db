import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Server function for accepting invitations
const acceptInvitation = createServerFn({ method: 'POST' })
  .validator((data: { invitationId: string }) => data)
  .handler(async ({ data }) => {
    const { OrganizationAPI } = await import('@lax-db/core/organization/index');
    const { getWebRequest } = await import('@tanstack/react-start/server');

    const request = getWebRequest();
    return await OrganizationAPI.acceptInvitation(data, request.headers);
  });

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

const formSchema = z.object({
  invitationId: z
    .string()
    .min(1, 'Invitation code is required')
    .min(10, 'Invitation code must be at least 10 characters'),
});

type FormData = z.infer<typeof formSchema>;

export const Route = createFileRoute('/_dashboard/organizations/join')({
  component: JoinOrganizationPage,
});

function JoinOrganizationPage() {
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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
      router.navigate({ to: '/teams' });
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
        <Link to="/teams">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
        </Link>

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
                  type="button"
                  variant="outline"
                  className="flex-1"
                  asChild
                >
                  <Link to="/teams">Cancel</Link>
                </Button>
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
