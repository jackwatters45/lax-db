import { RiArrowDownSLine, RiArrowUpSLine } from '@remixicon/react';
import type { Column } from '@tanstack/react-table';

import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLButtonElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const sortingHandler = column.getToggleSortingHandler();
      if (sortingHandler) {
        sortingHandler(event);
      }
    }
  };

  return (
    <button
      onClick={column.getToggleSortingHandler()}
      onKeyDown={handleKeyDown}
      className={cn(
        column.columnDef.enableSorting === true
          ? '-mx-2 inline-flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring'
          : 'inline-flex items-center gap-2',
        className,
      )}
      aria-label={`Sort by ${title}`}
      type="button"
      {...props}
    >
      <span>{title}</span>
      {column.getCanSort() ? (
        <div className="-space-y-2">
          <RiArrowUpSLine
            className={cn(
              'size-3.5 text-foreground',
              column.getIsSorted() === 'desc' ? 'opacity-30' : '',
            )}
            aria-hidden="true"
          />
          <RiArrowDownSLine
            className={cn(
              'size-3.5 text-foreground',
              column.getIsSorted() === 'asc' ? 'opacity-30' : '',
            )}
            aria-hidden="true"
          />
        </div>
      ) : null}
    </button>
  );
}
