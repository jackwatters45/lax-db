import { useLocation } from '@tanstack/react-router';
import { Navbar } from '@/components/nav/navbar';

const projectNavItems = [
  { label: 'Plan', href: '/plan' },
  { label: 'Teams', href: '/teams' },
];

export function ProjectNavbar() {
  const location = useLocation();

  const navItems = projectNavItems.map((item) => ({
    ...item,
    isActive: location.pathname.startsWith(item.href),
  }));

  return <Navbar items={navItems} />;
}
