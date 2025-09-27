'use client';

import type { Table } from '@tanstack/react-table';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Searchbar } from '@/components/ui/searchbar';
import { formatters } from '@/lib/formatters';
import { conditions, regions, statuses } from '../../../settings/-data';
import { DataTableFilter } from './DataTableFilter';
import { ViewOptions } from './DataTableViewOptions';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function Filterbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [searchTerm, setSearchTerm] = useState<string>('');

  const debouncedSetFilterValue = (value: string) => {
    table.getColumn('owner')?.setFilterValue(value);
  };

  const handleSearchChange = (event: any) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSetFilterValue(value);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-x-6">
      <div className="flex w-full flex-col gap-2 sm:w-fit sm:flex-row sm:items-center">
        {table.getColumn('status')?.getIsVisible() && (
          <DataTableFilter
            column={table.getColumn('status')}
            title="Status"
            options={statuses}
            type="select"
          />
        )}
        {table.getColumn('region')?.getIsVisible() && (
          <DataTableFilter
            column={table.getColumn('region')}
            title="Region"
            options={regions}
            type="checkbox"
          />
        )}
        {table.getColumn('costs')?.getIsVisible() && (
          <DataTableFilter
            column={table.getColumn('costs')}
            title="Costs"
            type="number"
            options={conditions}
            formatter={formatters.currency}
          />
        )}
        {table.getColumn('owner')?.getIsVisible() && (
          <Searchbar
            placeholder="Search by owner..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:max-w-[250px] sm:[&>input]:h-[30px]"
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="border border-border px-2 font-semibold text-primary sm:border-none sm:py-1"
          >
            Clear filters
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ViewOptions table={table} />
      </div>
    </div>
  );
}
