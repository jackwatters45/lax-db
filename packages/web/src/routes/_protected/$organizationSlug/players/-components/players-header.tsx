import { Link } from '@tanstack/react-router';
import { Navbar, NavbarItem } from '@/components/nav/sub-nav';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';

type PlayersHeaderProps = {
  organizationSlug: string;
  children: React.ReactNode;
};

export function PlayersHeader({
  organizationSlug,
  children,
}: PlayersHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <PlayersSubNav organizationSlug={organizationSlug} />
    </div>
  );
}

type PlayersSubNavProps = {
  organizationSlug: string;
};

export function PlayersSubNav({ organizationSlug }: PlayersSubNavProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/players"
          params={{ organizationSlug }}
          activeOptions={{ exact: true }}
        >
          Table
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/players/dashboard"
          params={{ organizationSlug }}
          activeOptions={{ exact: true }}
        >
          Dasboard
        </Link>
      </NavbarItem>
    </Navbar>
  );
}
