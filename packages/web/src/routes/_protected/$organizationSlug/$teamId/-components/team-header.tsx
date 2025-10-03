import { Link } from '@tanstack/react-router';
import { Navbar, NavbarItem } from '@/components/nav/sub-nav';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';

type TeamHeaderProps = {
  organizationSlug: string;
  teamId: string;
  children: React.ReactNode;
};

export function TeamHeader({
  organizationSlug,
  teamId,
  children,
}: TeamHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <TeamSubNav organizationSlug={organizationSlug} teamId={teamId} />
    </div>
  );
}

type TeamSubNavProps = {
  organizationSlug: string;
  teamId: string;
};

export function TeamSubNav({ organizationSlug, teamId }: TeamSubNavProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/$teamId"
          params={{ organizationSlug, teamId }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/$teamId/players"
          params={{ organizationSlug, teamId }}
        >
          Players
        </Link>
      </NavbarItem>
    </Navbar>
  );
}
