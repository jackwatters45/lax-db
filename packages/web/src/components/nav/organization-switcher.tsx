import type { Organization } from '@lax-db/core/organization/index';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouteContext } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';
import { ChevronsUpDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Server function to switch active organization
const switchActiveOrganization = createServerFn({ method: 'POST' })
  .validator((data: { organizationId: string }) => data)
  .handler(async ({ data }) => {
    const { auth } = await import('@lax-db/core/auth');

    const { headers } = getWebRequest();

    // Set the active organization in Better Auth
    await auth.api.setActiveOrganization({
      headers,
      body: {
        organizationId: data.organizationId,
      },
    });

    return { success: true };
  });

export function OrganizationSwitcher() {
  // Get organizations and active org from route context (no loading state!)
  const { organizations, activeOrganization } = useRouteContext({
    from: '/_dashboard',
  });

  // Mutation to switch organization with optimistic updates
  const switchOrgMutation = useMutation({
    mutationFn: (organizationId: string) =>
      switchActiveOrganization({ data: { organizationId } }),
    onError: (error) => {
      toast.error('Failed to switch organization');
      console.error('Switch organization error:', error);
    },
    onSuccess: (_data, _variables, _result, context) => {
      context.client.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Organization switched successfully');
      window.location.reload();
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={'ghost'}
          className={
            'px-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
          }
        >
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {activeOrganization?.name || 'No Organization'}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        side="right"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Switch Organization
        </DropdownMenuLabel>
        {organizations.map((org: Organization) => {
          const isActive = activeOrganization?.id === org.id;

          return (
            <DropdownMenuItem
              key={org.id}
              onClick={() => !isActive && switchOrgMutation.mutate(org.id)}
              className="flex w-full items-center justify-between gap-2 p-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                  <span className="font-medium text-xs">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span>{org.name}</span>
              </div>
              {isActive && (
                <div className="h-2 w-2 rounded-full bg-green-500" />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/organizations/create"
            className="flex items-center gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-md border bg-background">
              <Plus className="h-4" />
            </div>
            <div className="font-medium text-muted-foreground">
              Create Organization
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to="/organizations/join"
            className="flex items-center gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-md border bg-background">
              <Plus className="h-4" />
            </div>
            <div className="font-medium text-muted-foreground">
              Join Organization
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
