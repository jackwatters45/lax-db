import { useLocation } from '@tanstack/react-router';
import { Navbar } from '@/components/nav/navbar';

const projectNavItems = [
  { label: 'Teams', href: '/teams' },
  { label: 'Games', href: '/games' },
  { label: 'Players', href: '/players' },
  { label: 'Playbook', href: '/playbook' },
  { label: 'Practice', href: '/practice' },
  { label: 'Film', href: '/film' },
  { label: 'Scouting', href: '/scouting' },
  { label: 'Settings', href: '/settings' },
];

export function ProjectNavbar() {
  const location = useLocation();

  const navItems = projectNavItems.map((item) => ({
    ...item,
    isActive: location.pathname.startsWith(item.href),
  }));

  return <Navbar items={navItems} />;
}
