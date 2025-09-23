import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { protectedMiddleware } from '@/lib/middleware';

const createOrganization = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator((data: { name: string; slug: string }) => data)
  .handler(async ({ data, context }) => {
    const { OrganizationAPI } = await import('@lax-db/core/organization/index');

    return await OrganizationAPI.createOrganization(data, context.headers);
  });

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Club name is required')
    .min(3, 'Club name must be at least 3 characters')
    .max(100, 'Club name must be less than 100 characters'),
  slug: z
    .string()
    .min(1, 'Club slug is required')
    .min(3, 'Club slug must be at least 3 characters')
    .max(50, 'Club slug must be less than 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Club slug can only contain lowercase letters, numbers, and hyphens',
    ),
});
type FormData = z.infer<typeof formSchema>;

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
};

export const Route = createFileRoute('/_protected/organizations/create')({
  component: CreateOrganizationPage,
});

function CreateOrganizationPage() {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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
                <Button
                  type="submit"
                  disabled={createOrgMutation.isPending}
                  className={'w-full'}
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
