import { Link } from '@tanstack/react-router';
import { Navbar, NavbarItem } from '@/components/nav/sub-nav';

type SettingsHeaderProps = {
  organizationSlug: string;
};

export function SettingsSubNav({ organizationSlug }: SettingsHeaderProps) {
  return (
    <Navbar className="border-b">
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/settings/general"
          params={{ organizationSlug }}
        >
          General
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/settings/users"
          params={{ organizationSlug }}
        >
          Users
        </Link>
      </NavbarItem>
      <NavbarItem asChild>
        <Link
          to="/$organizationSlug/settings/billing"
          params={{ organizationSlug }}
        >
          Billing
        </Link>
      </NavbarItem>
    </Navbar>
  );
}
