import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface NavbarProps {
  items: NavItem[];
  className?: string;
}

export function Navbar({ items, className }: NavbarProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const activeItemIndex = items.findIndex((item) => item.isActive);
    if (activeItemIndex !== -1) {
      setActiveIndex(activeItemIndex);
    }
  }, [items]);

  useEffect(() => {
    const updateIndicator = () => {
      const activeLink = linkRefs.current[activeIndex];
      if (activeLink && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();

        setIndicatorStyle({
          left: linkRect.left - navRect.left,
          width: linkRect.width,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);

    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeIndex]);

  return (
    <div
      ref={navRef}
      className={cn(
        'relative mt-2 flex h-[46px] items-center [&>*]:shrink-0',
        className,
      )}
    >
      {items.map((item, index) => (
        <Link
          key={item.href}
          to={item.href}
          ref={(el) => {
            linkRefs.current[index] = el;
          }}
          className={cn(
            'relative inline-block select-none px-3 py-4 font-normal text-sm leading-[0.875rem] no-underline transition-colors duration-200 ease-out',
            item.isActive
              ? 'text-gray-950'
              : 'text-gray-800 hover:text-gray-9500',
          )}
          style={{ outlineOffset: '-6px' }}
          onClick={() => setActiveIndex(index)}
        >
          {item.label}
        </Link>
      ))}

      <div
        className="absolute bottom-0 h-[2px] bg-foreground transition-all duration-150 ease-out"
        style={{
          left: indicatorStyle.left + 12, // 12px padding offset
          width: indicatorStyle.width - 24, // Account for padding on both sides
          transform: 'scaleX(0.84)',
          transformOrigin: '0 0 0',
        }}
      />
    </div>
  );
}
