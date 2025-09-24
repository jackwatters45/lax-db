import { useMutation } from '@tanstack/react-query';
import { Link, useRouteContext, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ChevronsUpDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { protectedMiddleware } from '@/lib/middleware';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';

// Server function to switch active organization
const switchActiveOrganization = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator((data: { organizationId: string }) => data)
  .handler(async ({ data, context }) => {
    const { auth } = await import('@lax-db/core/auth');

    // Set the active organization in Better Auth
    await auth.api.setActiveOrganization({
      headers: context.headers,
      body: {
        organizationId: data.organizationId,
      },
    });

    return { success: true };
  });

export function OrganizationSwitcher() {
  const router = useRouter();
  const { organizations, activeOrganization } = useRouteContext({
    from: '/_protected/$organizationSlug',
  });

  // Mutation to switch organization
  const switchOrgMutation = useMutation({
    mutationFn: (organizationId: string) =>
      switchActiveOrganization({ data: { organizationId } }),
    onError: (error) => {
      toast.error('Failed to switch organization');
      console.error('Switch organization error:', error);
    },
    onSuccess: (_data, organizationId, _result, context) => {
      context.client.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Organization switched successfully');

      const newOrg = organizations.find((org) => org.id === organizationId);
      if (newOrg) {
        router.navigate({ to: `/${newOrg.slug}` });
      } else {
        window.location.reload();
      }
    },
  });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={activeOrganization.logo ?? undefined}
                  alt={activeOrganization.name ?? 'No Organization'}
                />
                <AvatarFallback className="rounded-lg uppercase">
                  {activeOrganization.name?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrganization?.name || 'No Organization'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
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
            {organizations.map((org) => {
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
