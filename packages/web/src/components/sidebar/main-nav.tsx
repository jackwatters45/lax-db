import { Link, useRouteContext } from '@tanstack/react-router';
import { Settings, Trophy, User, Users } from 'lucide-react';
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
              to={'/$organizationSlug/teams'}
              params={{ organizationSlug: activeOrganization.slug }}
              activeProps={{ className: 'bg-muted' }}
            >
              <Users />
              <span>Teams</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Players'}>
            <Link
              to={'/$organizationSlug/players'}
              params={{ organizationSlug: activeOrganization.slug }}
              activeProps={{ className: 'bg-muted' }}
            >
              <User />
              <span>Players</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Games'}>
            <Link
              to={'/$organizationSlug/games'}
              params={{ organizationSlug: activeOrganization.slug }}
              activeProps={{ className: 'bg-muted' }}
            >
              <Trophy />
              <span>Games</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {/*<SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Playbook'}>
            <Link
              to={'/$organizationSlug/playbook'}
              params={{ organizationSlug: activeOrganization.slug }}
            >
              <BookOpen />
              <span>Playbook</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Practice'}>
            <Link
              to={'/$organizationSlug/practice'}
              params={{ organizationSlug: activeOrganization.slug }}
            >
              <Dumbbell />
              <span>Practice</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Film'}>
            <Link
              to={'/$organizationSlug/film'}
              params={{ organizationSlug: activeOrganization.slug }}
            >
              <Video />
              <span>Film</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Scouting'}>
            <Link
              to={'/$organizationSlug/scouting'}
              params={{ organizationSlug: activeOrganization.slug }}
            >
              <Search />
              <span>Scouting</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>*/}
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'Settings'}>
            <Link
              to={'/$organizationSlug/settings/general'}
              params={{ organizationSlug: activeOrganization.slug }}
              activeProps={{ className: 'bg-muted' }}
            >
              <Settings />
              <span>Settings</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
