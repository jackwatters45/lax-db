import { RiSearchLine } from '@remixicon/react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface SearchbarProps extends React.ComponentProps<'input'> {
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Searchbar = React.forwardRef<HTMLInputElement, SearchbarProps>(
  ({ className, placeholder = 'Search...', ...props }, ref) => {
    return (
      <div className="relative">
        <RiSearchLine className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          className={cn('h-8 pl-9', className)}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Searchbar.displayName = 'Searchbar';

export { Searchbar };
