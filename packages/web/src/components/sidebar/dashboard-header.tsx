import { Search, User } from 'lucide-react';
import React, { Fragment } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function DashboardHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="sticky top-0 right-0 left-0 z-40 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background pr-2 pl-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger className="-ml-1" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Sidebar (⌘+B)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">{children}</BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}

interface DashboardHeaderProps {
  breadcrumbItems: {
    label: string;
    href: string | null;
  }[];
}

export function DashboardHeaderOld(props: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 right-0 left-0 z-40 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background pr-2 pl-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger className="-ml-1" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Sidebar (⌘+B)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">
            {props.breadcrumbItems.map((item, i) => (
              <Fragment key={item.label}>
                <BreadcrumbItem
                  className={
                    i === props.breadcrumbItems.length - 1
                      ? 'min-w-0 flex-1'
                      : ''
                  }
                >
                  {item.href ? (
                    <BreadcrumbLink
                      href={item.href}
                      className={`truncate ${i === props.breadcrumbItems.length - 1 ? 'max-w-full' : ''}`}
                      title={item.label}
                    >
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage
                      className={`truncate ${i === props.breadcrumbItems.length - 1 ? 'max-w-full' : ''}`}
                      title={item.label}
                    >
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {i !== props.breadcrumbItems.length - 1 && (
                  <BreadcrumbSeparator />
                )}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/*<SearchCommand />*/}
    </header>
  );
}

function _SearchCommand() {
  const [open, setOpen] = React.useState(false);

  useHotkeys('meta+k', () => setOpen(true));

  return (
    <>
      <Button
        className="h-8 cursor-text justify-between border-input bg-secondary pr-1 pl-2 font-normal text-foreground focus:border-ring focus:ring-0 sm:w-48"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <div className="flex items-center gap-2 text-sm">
          <Search className="size-3 transform text-muted-foreground" />
          <span className="hidden sm:block">Search</span>
        </div>
        <kbd className="rounded-md border bg-muted px-1 py-0.5 font-semibold text-muted-foreground text-xs">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {/* TODO: implement search */}
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <span>Calendar</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>
              <User />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
