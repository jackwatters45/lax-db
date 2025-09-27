'use client';
import {
  RiHome2Line,
  RiLinkM,
  RiListCheck,
  RiSettings5Line,
} from '@remixicon/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/app/siteConfig';
import { cx, focusRing } from '@/lib/utils';
import MobileSidebar from './MobileSidebar';
import {
  WorkspacesDropdownDesktop,
  WorkspacesDropdownMobile,
} from './SidebarWorkspacesDropdown';
import { UserProfileDesktop, UserProfileMobile } from './UserProfile';

const navigation = [
  { name: 'Overview', href: siteConfig.baseLinks.overview, icon: RiHome2Line },
  { name: 'Details', href: siteConfig.baseLinks.details, icon: RiListCheck },
  {
    name: 'Settings',
    href: siteConfig.baseLinks.settings.general,
    icon: RiSettings5Line,
  },
] as const;

const shortcuts = [
  {
    name: 'Add new user',
    href: '/settings/users',
    icon: RiLinkM,
  },
  {
    name: 'Workspace usage',
    href: '/settings/billing#billing-overview',
    icon: RiLinkM,
  },
  {
    name: 'Cost spend control',
    href: '/settings/billing#cost-spend-control',
    icon: RiLinkM,
  },
  {
    name: 'Overview – Rows written',
    href: '/overview#usage-overview',
    icon: RiLinkM,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (itemHref: string) => {
    if (itemHref === siteConfig.baseLinks.settings.general) {
      return pathname.startsWith('/settings');
    }
    return pathname === itemHref || pathname.startsWith(itemHref);
  };
  return (
    <>
      {/* sidebar (lg+) */}
      <nav className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <aside className="flex grow flex-col gap-y-6 overflow-y-auto border-gray-200 border-r bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <WorkspacesDropdownDesktop />
          <nav
            aria-label="core navigation links"
            className="flex flex-1 flex-col space-y-10"
          >
            <ul className="space-y-0.5">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cx(
                      isActive(item.href)
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-700 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50',
                      'flex items-center gap-x-2.5 rounded-md px-2 py-1.5 font-medium text-sm transition hover:bg-gray-100 hover:dark:bg-gray-900',
                      focusRing,
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div>
              <span className="font-medium text-gray-500 text-xs leading-6">
                Shortcuts
              </span>
              <ul aria-label="shortcuts" className="space-y-0.5">
                {shortcuts.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cx(
                        pathname === item.href || pathname.startsWith(item.href)
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-700 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50',
                        'flex items-center gap-x-2.5 rounded-md px-2 py-1.5 font-medium text-sm transition hover:bg-gray-100 hover:dark:bg-gray-900',
                        focusRing,
                      )}
                    >
                      <item.icon
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
          <div className="mt-auto">
            <UserProfileDesktop />
          </div>
        </aside>
      </nav>
      {/* top navbar (xs-lg) */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-gray-200 border-b bg-white px-2 shadow-sm sm:gap-x-6 sm:px-4 lg:hidden dark:border-gray-800 dark:bg-gray-950">
        <WorkspacesDropdownMobile />
        <div className="flex items-center gap-1 sm:gap-2">
          <UserProfileMobile />
          <MobileSidebar />
        </div>
      </div>
    </>
  );
}
