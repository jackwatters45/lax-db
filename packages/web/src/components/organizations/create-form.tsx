import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { OrganizationService } from '@lax-db/core/organization/index';
import { RuntimeServer } from '@lax-db/core/runtime.server';
import { useMutation } from '@tanstack/react-query';
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema as S } from 'effect';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/page-content';
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
import { authMiddleware } from '@/lib/middleware';
import { CreateOrganizationSchema } from '@/lib/schema';

const createOrganization = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof CreateOrganizationSchema.Type) =>
    S.decodeSync(CreateOrganizationSchema)(data),
  )
  .handler(async ({ data, context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const organizationService = yield* OrganizationService;
        return yield* organizationService.createOrganization(
          data,
          context.headers,
        );
      }),
    ),
  );

type FormData = typeof CreateOrganizationSchema.Type;

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
};

export function CreateOrganizationForm({
  organizationSlug,
}: {
  organizationSlug?: string;
}) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const form = useForm<FormData>({
    resolver: effectTsResolver(CreateOrganizationSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: (data: FormData) => createOrganization({ data }),
    onSuccess: async (result, variables) => {
      await router.invalidate();
      router.navigate({
        to: '/$organizationSlug/$teamId/setup',
        params: { organizationSlug: variables.slug, teamId: result.teamId },
      });
    },
    onError: (error, variables) => {
      if (error.message === 'Slug is not available') {
        toast.error(
          `Slug "${variables.slug}" is not available. Please try a different slug.`,
        );
      } else {
        toast.error('Failed to create organization. Please try again.');
      }
    },
  });

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    form.setValue('slug', slug);
  };

  const onSubmit = (data: FormData) => {
    createOrgMutation.mutate(data);
  };

  return (
    <PageContainer className="space-y-4">
      <div>
        <h1 className="font-bold text-xl">Create Your Athletic Club</h1>
        <p className="text-muted-foreground">
          Set up your organization to start managing teams and players
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Malvern Lacrosse Club"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Slug (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="malvern-lacrosse-club" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be used in your club's URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                {organizationSlug ? (
                  <Button type="button" variant="outline" asChild>
                    <Link
                      to="/$organizationSlug"
                      params={{ organizationSlug }}
                      onClick={(e) => {
                        if (canGoBack) {
                          e.preventDefault();
                          router.history.back();
                        }
                      }}
                    >
                      Cancel
                    </Link>
                  </Button>
                ) : null}
                <Button type="submit" disabled={createOrgMutation.isPending}>
                  {createOrgMutation.isPending ? 'Creating...' : 'Create Club'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
