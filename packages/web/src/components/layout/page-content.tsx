import { cn } from '@/lib/utils';

interface PageBodyProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageBody component for the scrollable content area.
 * Use this to wrap the main content that should scroll.
 */
export function PageBody({ children, className }: PageBodyProps) {
  return (
    <div className={cn('flex-1 overflow-auto', className)}>{children}</div>
  );
}
