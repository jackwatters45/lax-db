import { RiEqualizer2Line } from '@remixicon/react';
import type { Table } from '@tanstack/react-table';
import { Grid2X2, List } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TabsList, TabsTrigger } from '../ui/tabs';

type FilterBarActions = {
  onAdd?: () => void;
};

type FilterBarContextValue<TData = unknown> = {
  table: Table<TData>;
  actions?: FilterBarActions;
};

const FilterBarContext =
  React.createContext<FilterBarContextValue<unknown> | null>(null);

export function useFilterBar<TData = unknown>(): FilterBarContextValue<TData> {
  const context = React.use(FilterBarContext);
  if (!context) {
    throw new Error('useFilterBar must be used within a FilterBarProvider');
  }
  return context as FilterBarContextValue<TData>;
}

type FilterBarProviderProps<TData = unknown> = {
  table: Table<TData>;
  actions?: FilterBarActions;
  children?: React.ReactNode;
};

function FilterBarProvider<TData>({
  table,
  actions,
  children,
}: FilterBarProviderProps<TData>) {
  const value = React.useMemo(
    () => ({
      table,
      actions,
    }),
    [table, actions],
  );

  return (
    <FilterBarContext.Provider value={value as FilterBarContextValue<unknown>}>
      {children}
    </FilterBarContext.Provider>
  );
}

type FilterBarProps = {
  children: React.ReactNode;
  className?: string;
};

function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 px-4 sm:gap-x-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

type FilterGroupProps = {
  children: React.ReactNode;
  className?: string;
};

function FilterGroup({ children, className }: FilterGroupProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col gap-2 sm:w-fit sm:flex-row sm:items-center',
        className,
      )}
    >
      {children}
    </div>
  );
}

function FilterActions({ children, className }: FilterGroupProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>{children}</div>
  );
}

function FilterBarViewOptions() {
  const { table } = useFilterBar();
  const columns = table.getAllColumns();

  return (
    <div>
      <div className="flex justify-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto flex h-7 gap-x-2 text-sm sm:text-xs"
            >
              <RiEqualizer2Line className="size-4" aria-hidden="true" />
              View
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={7}
            className="z-50 w-fit space-y-2"
          >
            <Label className="font-medium">Display properties</Label>
            <div className="flex flex-col space-y-1">
              {columns.map((column) => {
                if (!column.getCanHide()) return null;
                const label =
                  (column.columnDef.meta?.displayName as string) || column.id;
                return (
                  <div
                    key={column.id}
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Checkbox
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      aria-label={`Toggle ${label} column visibility`}
                    />
                    <Label className="cursor-pointer font-normal text-sm">
                      {label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

type FilterBarAddButtonProps = React.PropsWithChildren & {
  className?: string;
};

function FilterBarAddButton({ children, className }: FilterBarAddButtonProps) {
  const { actions } = useFilterBar();

  return (
    <Button onClick={actions?.onAdd} size={'sm'} className={className}>
      {children}
    </Button>
  );
}

function FilterBarDisplayTypeToggle() {
  return (
    <TabsList>
      <TabsTrigger value="list">
        <List className="size-4" />
      </TabsTrigger>
      <TabsTrigger value="cards">
        <Grid2X2 className="size-4" />
      </TabsTrigger>
    </TabsList>
  );
}

// re-export data-table-filters
import {
  FilterCheckbox,
  FilterClear,
  FilterNumber,
  FilterSearch,
  FilterSelect,
} from './data-table-filters';

export {
  FilterActions,
  FilterBar,
  FilterBarProvider,
  FilterGroup,
  FilterBarViewOptions,
  FilterBarDisplayTypeToggle,
  FilterBarAddButton,
  FilterCheckbox,
  FilterClear,
  FilterNumber,
  FilterSearch,
  FilterSelect,
};
