import { Link } from '@tanstack/react-router';
import { Navbar, NavbarItem } from '@/components/nav/sub-nav';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';

type GamesHeaderProps = {
  organizationSlug: string;
  children: React.ReactNode;
};

export function GamesHeader({ organizationSlug, children }: GamesHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <GamesSubNav organizationSlug={organizationSlug} />
    </div>
  );
}

type GamesSubNavProps = {
  organizationSlug: string;
};

export function GamesSubNav({ organizationSlug }: GamesSubNavProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/games"
          params={{ organizationSlug }}
          activeOptions={{ exact: true }}
        >
          Info
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/games/old"
          params={{ organizationSlug }}
          activeOptions={{ exact: true }}
        >
          Old
        </Link>
      </NavbarItem>
    </Navbar>
  );
}
