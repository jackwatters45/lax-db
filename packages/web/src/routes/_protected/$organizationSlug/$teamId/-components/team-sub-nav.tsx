import { Link } from '@tanstack/react-router';
import { Navbar, NavbarItem } from '@/components/nav/sub-nav';

type TeamHeaderProps = {
  organizationSlug: string;
  teamId: string;
};

export function TeamSubNav({ organizationSlug, teamId }: TeamHeaderProps) {
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
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/$teamId/meep"
          params={{ organizationSlug, teamId }}
        >
          Meep
        </Link>
      </NavbarItem>
    </Navbar>
  );
}
