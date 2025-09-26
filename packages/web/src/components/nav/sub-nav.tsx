import { useLocation } from '@tanstack/react-router';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface NavbarContextValue {
  indicatorStyle: { left: number; width: number };
  navRef: React.RefObject<HTMLDivElement | null>;
  activeHref: string;
}

const NavbarContext = React.createContext<NavbarContextValue | null>(null);

function useNavbar() {
  const context = React.useContext(NavbarContext);
  if (!context) {
    throw new Error('Navbar components must be used within NavbarRoot');
  }
  return context;
}

const NavbarRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const location = useLocation();
  const [indicatorStyle, setIndicatorStyle] = React.useState({
    left: 0,
    width: 0,
  });
  const navRef = React.useRef<HTMLDivElement | null>(null);

  const activeHref = location.pathname;

  React.useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;

      // Find the NavbarItem that contains the active link
      const navbarItems = navRef.current.querySelectorAll('[data-navbar-item]');
      let activeItem: HTMLElement | null = null;

      for (const item of navbarItems) {
        const activeLink = (item as HTMLElement).querySelector(
          'a[data-status="active"]',
        );
        if (activeLink) {
          activeItem = item as HTMLElement;
          break;
        }
      }

      if (activeItem) {
        const navRect = navRef.current.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();

        setIndicatorStyle({
          left: itemRect.left - navRect.left,
          width: itemRect.width,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);

    return () => window.removeEventListener('resize', updateIndicator);
  }, []);

  return (
    <NavbarContext.Provider
      value={{
        indicatorStyle,
        navRef,
        activeHref,
      }}
    >
      <div
        ref={(node) => {
          navRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          'relative flex h-[46px] items-center [&>*]:shrink-0',
          className,
        )}
        {...props}
      >
        {children}
        <div
          className="absolute bottom-0 h-[2px] bg-foreground transition-all duration-150 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>
    </NavbarContext.Provider>
  );
});
NavbarRoot.displayName = 'NavbarRoot';

const NavbarItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-navbar-item
      className={cn(
        'relative inline-block select-none px-3 py-4 font-normal text-gray-800 text-sm leading-[0.875rem] no-underline transition-colors duration-200 ease-out hover:bg-accent hover:text-gray-950',
        className,
      )}
      style={{ outlineOffset: '-6px' }}
      {...props}
    >
      {children}
    </div>
  );
});
NavbarItem.displayName = 'NavbarItem';

const NavbarIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { indicatorStyle } = useNavbar();

  return (
    <div
      ref={ref}
      className={cn(
        'absolute bottom-0 h-[2px] bg-foreground transition-all duration-150 ease-out',
        className,
      )}
      style={{
        left: indicatorStyle.left + 12,
        width: indicatorStyle.width - 24,
        transform: 'scaleX(0.84)',
        transformOrigin: '0 0 0',
      }}
      {...props}
    />
  );
});
NavbarIndicator.displayName = 'NavbarIndicator';

const Navbar = NavbarRoot;

export { Navbar, NavbarRoot, NavbarItem };
