import { Link } from '@tanstack/react-router';
import { Navbar, NavbarItem } from '@/components/nav/sub-nav';

type TeamHeaderProps = {
  organizationSlug: string;
  teamId: string;
};

export function TeamSubNav({ organizationSlug, teamId }: TeamHeaderProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem>
        <Link
          to="/$organizationSlug/$teamId"
          params={{ organizationSlug, teamId }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>
      </NavbarItem>
      <NavbarItem>
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
