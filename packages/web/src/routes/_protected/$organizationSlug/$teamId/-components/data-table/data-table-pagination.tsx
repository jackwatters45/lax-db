import {
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
} from '@remixicon/react';
import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSize: number;
}

export function DataTablePagination<TData>({
  table,
  pageSize,
}: DataTablePaginationProps<TData>) {
  const paginationButtons = [
    {
      icon: RiArrowLeftDoubleLine,
      onClick: () => table.setPageIndex(0),
      disabled: !table.getCanPreviousPage(),
      srText: 'First page',
      mobileView: 'hidden sm:block',
    },
    {
      icon: RiArrowLeftSLine,
      onClick: () => table.previousPage(),
      disabled: !table.getCanPreviousPage(),
      srText: 'Previous page',
      mobileView: '',
    },
    {
      icon: RiArrowRightSLine,
      onClick: () => table.nextPage(),
      disabled: !table.getCanNextPage(),
      srText: 'Next page',
      mobileView: '',
    },
    {
      icon: RiArrowRightDoubleLine,
      onClick: () => table.setPageIndex(table.getPageCount() - 1),
      disabled: !table.getCanNextPage(),
      srText: 'Last page',
      mobileView: 'hidden sm:block',
    },
  ];

  const totalRows = table.getFilteredRowModel().rows.length;
  const currentPage = table.getState().pagination.pageIndex;
  const firstRowIndex = currentPage * pageSize + 1;
  const lastRowIndex = Math.min(totalRows, firstRowIndex + pageSize - 1);

  return (
    <div className="flex items-center justify-between">
      <div className="text-gray-500 text-sm tabular-nums">
        {table.getFilteredSelectedRowModel().rows.length} of {totalRows} row(s)
        selected.
      </div>
      <div className="flex items-center gap-x-6 lg:gap-x-8">
        <p className="hidden text-gray-500 text-sm tabular-nums sm:block">
          Showing{' '}
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {firstRowIndex}-{lastRowIndex}
          </span>{' '}
          of{' '}
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {totalRows}
          </span>
        </p>
        <div className="flex items-center gap-x-1.5">
          {paginationButtons.map((button) => (
            <Button
              key={button.srText}
              variant="secondary"
              className={cn(button.mobileView, 'p-1.5')}
              onClick={() => {
                button.onClick();
                table.resetRowSelection();
              }}
              disabled={button.disabled}
            >
              <span className="sr-only">{button.srText}</span>
              <button.icon className="size-4 shrink-0" aria-hidden="true" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
