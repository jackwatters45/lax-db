import { useLocation } from '@tanstack/react-router';
import { Navbar } from '@/components/nav/navbar';

const projectNavItems = [
  { label: 'Index', href: '/' },
  { label: 'Home', href: '/home' },
  { label: 'Team', href: '/team' },
];

export function ProjectNavbar() {
  const location = useLocation();

  const navItems = projectNavItems.map((item) => ({
    ...item,
    isActive: location.pathname === item.href,
  }));

  return <Navbar items={navItems} />;
}
