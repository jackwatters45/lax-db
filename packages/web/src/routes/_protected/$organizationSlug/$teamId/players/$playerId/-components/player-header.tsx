import { Link } from '@tanstack/react-router';
import { Navbar, NavbarItem } from '@/components/nav/sub-nav';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';

type PlayerHeaderProps = {
  organizationSlug: string;
  teamId: string;
  playerId: string;
  children: React.ReactNode;
};

export function PlayerHeader({
  organizationSlug,
  teamId,
  playerId,
  children,
}: PlayerHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <PlayerSubNav
        organizationSlug={organizationSlug}
        teamId={teamId}
        playerId={playerId}
      />
    </div>
  );
}

type PlayerSubNavProps = {
  organizationSlug: string;
  teamId: string;
  playerId: string;
};

export function PlayerSubNav({
  organizationSlug,
  teamId,
  playerId,
}: PlayerSubNavProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/$teamId/players/$playerId"
          params={{ organizationSlug, teamId, playerId }}
          activeOptions={{ exact: true }}
        >
          Info
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/$teamId/players/$playerId/edit"
          params={{ organizationSlug, teamId, playerId }}
          activeOptions={{ exact: true }}
        >
          Edit
        </Link>
      </NavbarItem>
    </Navbar>
  );
}
