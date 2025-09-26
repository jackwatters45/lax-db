import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { useMutation } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  useRouteContext,
  useRouter,
} from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema } from 'effect';
import { ArrowLeft } from 'lucide-react';
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
import { authMiddleware } from '@/lib/middleware';

const createOrganization = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { name: string; slug: string }) => data)
  .handler(async ({ data, context }) => {
    const { OrganizationAPI } = await import('@lax-db/core/organization/index');

    return await OrganizationAPI.createOrganization(data, context.headers);
  });

const formSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Club name is required' }),
    Schema.minLength(3, {
      message: () => 'Club name must be at least 3 characters',
    }),
    Schema.maxLength(100, {
      message: () => 'Club name must be less than 100 characters',
    }),
  ),
  slug: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Club slug is required' }),
    Schema.minLength(3, {
      message: () => 'Club slug must be at least 3 characters',
    }),
    Schema.maxLength(50, {
      message: () => 'Club slug must be less than 50 characters',
    }),
    Schema.filter((slug) => /^[a-z0-9-]+$/.test(slug), {
      message: () =>
        'Club slug can only contain lowercase letters, numbers, and hyphens',
    }),
  ),
});
type FormData = typeof formSchema.Type;

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
};

export const Route = createFileRoute(
  '/_protected/organizations/create/$organizationSlug',
)({
  component: CreateOrganizationPage,
});

function CreateOrganizationPage() {
  const router = useRouter();
  const { organizationSlug } = Route.useParams();
  const { organizations } = useRouteContext({
    from: '/_protected/$organizationSlug',
  });

  // Check if user has existing organizations
  const hasExistingOrganizations = !!organizations.length;

  const form = useForm<FormData>({
    resolver: effectTsResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const createOrgMutation = useMutation({
    mutationKey: ['createOrganization'],
    mutationFn: (data: FormData) => createOrganization({ data }),
    onSuccess: async (_, variables) => {
      toast.success(`Organization "${variables.name}" created successfully!`);
      await router.invalidate();
      router.navigate({
        to: '/$organizationSlug',
        params: { organizationSlug: variables.slug },
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
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        {hasExistingOrganizations && (
          <Link to="/$organizationSlug" params={{ organizationSlug }}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </Button>
          </Link>
        )}

        <h1 className="font-bold text-3xl">Create Your Athletic Club</h1>
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
                {hasExistingOrganizations && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link to="/$organizationSlug" params={{ organizationSlug }}>
                      Cancel
                    </Link>
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={createOrgMutation.isPending}
                  className={hasExistingOrganizations ? 'flex-1' : 'w-full'}
                >
                  {createOrgMutation.isPending ? 'Creating...' : 'Create Club'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
