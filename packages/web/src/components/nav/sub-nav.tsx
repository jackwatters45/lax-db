import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cn } from '../../lib/utils';

const NavbarRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex h-[46px] items-center [&>*]:shrink-0', className)}
      {...props}
    >
      {children}
    </div>
  );
});
NavbarRoot.displayName = 'NavbarRoot';

const NavbarItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
  }
>(({ className, children, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref}
      className={cn(
        'relative inline-block select-none border-transparent border-b-2 px-3 py-4 font-normal text-muted-foreground text-sm leading-[0.875rem] transition-colors duration-200 ease-out hover:bg-accent',
        '[&.active]:border-foreground [&.active]:text-foreground [&.active]:no-underline',
        className,
      )}
      style={{ outlineOffset: '-6px' }}
      {...props}
    >
      {children}
    </Comp>
  );
});
NavbarItem.displayName = 'NavbarItem';

const Navbar = NavbarRoot;

export { Navbar, NavbarRoot, NavbarItem };
