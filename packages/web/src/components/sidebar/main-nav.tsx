import { Link, useRouteContext } from '@tanstack/react-router';
import { Square } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';

export function MainNav() {
  const { activeOrganization } = useRouteContext({
    from: '/_protected/$organizationSlug',
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={'sr-only'}>Main Nav</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Teams'}>
            <Link
              to={'/$organizationSlug'}
              params={{ organizationSlug: activeOrganization.slug }}
            >
              <Square />
              <span>Teams</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
