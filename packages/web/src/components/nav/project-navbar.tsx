import { useLocation } from '@tanstack/react-router';
import { Navbar } from '@/components/nav/navbar';

const projectNavItems = [
  { label: 'Index', href: '/' },
  { label: 'Home', href: '/home' },
  { label: 'Teams', href: '/teams' },
  { label: 'Team', href: '/team' },
];

export function ProjectNavbar() {
  const location = useLocation();

  const navItems = projectNavItems.map((item) => ({
    ...item,
    isActive:
      item.href === '/teams'
        ? location.pathname.startsWith('/teams')
        : location.pathname === item.href,
  }));

  return <Navbar items={navItems} />;
}
