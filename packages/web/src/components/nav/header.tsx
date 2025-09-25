import { Link } from '@tanstack/react-router';
import { Circle } from 'lucide-react';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NavUserHeader } from './nav-user';
import { OrganizationSwitcher } from './organization-switcher';
import { ProjectNavbar } from './project-navbar';
import { SearchCommand } from './search-command';

export function UnprotectedHeader() {
  const breadcrumbItems: {
    label: string;
    href: string | null;
  }[] = [];

  return (
    <header className="sticky top-0 right-0 left-0 z-40 border-b bg-background px-6 pt-4">
      <div className="flex h-full shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center">
          <Link to="/">
            <Circle className="-ml-1" />
          </Link>
          <Separator
            orientation="vertical"
            className="mr-2 ml-4 h-6 rotate-[18deg] "
          />
          <OrganizationSwitcher />
          <Breadcrumb className="min-w-0 flex-1">
            <BreadcrumbList className="flex-nowrap">
              {breadcrumbItems.map((item, i) => (
                <Fragment key={item.label}>
                  <BreadcrumbItem
                    className={
                      i === breadcrumbItems.length - 1 ? 'min-w-0 flex-1' : ''
                    }
                  >
                    {item.href ? (
                      <BreadcrumbLink
                        href={item.href}
                        className={`truncate ${i === breadcrumbItems.length - 1 ? 'max-w-full' : ''}`}
                        title={item.label}
                      >
                        {item.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage
                        className={`truncate ${i === breadcrumbItems.length - 1 ? 'max-w-full' : ''}`}
                        title={item.label}
                      >
                        {item.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {i !== breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/plan">
            <Button variant="outline" size={'sm'}>
              Plan
            </Button>
          </Link>
          <SearchCommand />
          <Button variant="outline" size={'sm'} asChild>
            <Link to="/feedback">Feedback</Link>
          </Button>
          <NavUserHeader />
        </div>
      </div>
      <ProjectNavbar />
    </header>
  );
}
