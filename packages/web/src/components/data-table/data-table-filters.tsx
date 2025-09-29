'use client';

import {
  RiAddLine,
  RiArrowDownSLine,
  RiCornerDownRightLine,
} from '@remixicon/react';
import type { Column } from '@tanstack/react-table';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { focusRing } from '@/lib/tw';
import { cn } from '@/lib/utils';
import { useFilterbar } from './data-table-filterbar';

export type ConditionFilter = {
  condition: string;
  value: [number | string, number | string];
};

type SharedFilterProps<TData, TValue> = {
  column: Column<TData, TValue> | undefined;
  title?: string;
  options: {
    label: string;
    value: string;
  }[];
};

type ColumnFilterLabelProps = {
  columnFilterLabels: string[] | undefined;
  className?: string;
};

const ColumnFiltersLabel = ({
  columnFilterLabels,
  className,
}: ColumnFilterLabelProps) => {
  if (!columnFilterLabels) return null;

  if (columnFilterLabels.length < 3) {
    return (
      <span className={cn('truncate', className)}>
        {columnFilterLabels.map((value, index) => (
          <span key={value} className={cn('font-semibold text-primary')}>
            {value}
            {index < columnFilterLabels.length - 1 && ', '}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={cn('font-semibold text-primary', className)}>
      {columnFilterLabels[0]} and {columnFilterLabels.length - 1} more
    </span>
  );
};

type FilterSearchProps = {
  column: string;
  placeholder?: string;
  className?: string;
};

function FilterSearch({
  column,
  placeholder = 'Search...',
  className,
}: FilterSearchProps) {
  const { table } = useFilterbar();

  const [searchTerm, setSearchTerm] = React.useState<string>('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    table.getColumn(column)?.setFilterValue(value);
  };

  return (
    <Input
      placeholder={placeholder}
      value={searchTerm}
      onChange={handleSearchChange}
      className={cn('h-7 w-full sm:max-w-[250px]', className)}
    />
  );
}

type FilterClearProps = { className?: string };

function FilterClear({ className }: FilterClearProps) {
  const { table } = useFilterbar();

  const isFiltered = table.getState().columnFilters.length > 0;

  if (!isFiltered) return null;

  return (
    <Button
      variant="ghost"
      onClick={() => table.resetColumnFilters()}
      className={cn(
        'border border-border px-2 font-semibold text-primary sm:border-none sm:py-1',
        className,
      )}
    >
      Clear filters
    </Button>
  );
}

// Individual filter components
type FilterSelectProps<TData, TValue> = SharedFilterProps<TData, TValue>;

function FilterSelect<TData, TValue>({
  column,
  title,
  options,
}: FilterSelectProps<TData, TValue>) {
  const columnFilters = column?.getFilterValue() as string;
  const [selectedValues, setSelectedValues] = React.useState<string>(
    columnFilters || '',
  );
  const [open, setOpen] = React.useState(false);

  const columnFilterLabels = React.useMemo(() => {
    if (!selectedValues) return undefined;
    return [selectedValues];
  }, [selectedValues]);

  React.useEffect(() => {
    setSelectedValues(columnFilters || '');
  }, [columnFilters]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-x-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1.5 font-medium text-muted-foreground hover:bg-muted sm:w-fit sm:text-xs',
            selectedValues ? '' : 'border-dashed',
            focusRing,
          )}
        >
          <span
            aria-hidden="true"
            onClick={(e) => {
              if (selectedValues) {
                e.stopPropagation();
                column?.setFilterValue('');
                setSelectedValues('');
              }
            }}
          >
            <RiAddLine
              className={cn(
                '-ml-px size-5 shrink-0 transition sm:size-4',
                selectedValues && 'rotate-45 hover:text-destructive',
              )}
              aria-hidden="true"
            />
          </span>
          {columnFilterLabels && columnFilterLabels.length > 0 ? (
            <span>{title}</span>
          ) : (
            <span className="w-full text-left sm:w-fit">{title}</span>
          )}
          {columnFilterLabels && columnFilterLabels.length > 0 && (
            <span className="h-4 w-px bg-border" aria-hidden="true" />
          )}
          <ColumnFiltersLabel
            columnFilterLabels={columnFilterLabels}
            className="w-full text-left sm:w-fit"
          />
          <RiArrowDownSLine
            className="size-5 shrink-0 text-muted-foreground sm:size-4"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={7}
        className="min-w-[calc(var(--radix-popover-trigger-width))] max-w-[calc(var(--radix-popover-trigger-width))] sm:min-w-56 sm:max-w-56"
        onInteractOutside={() => {
          if (!columnFilters || columnFilters === '') {
            column?.setFilterValue('');
            setSelectedValues('');
          }
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            column?.setFilterValue(selectedValues);
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <div>
              <Label className="font-medium text-base sm:text-sm">
                Filter by {title}
              </Label>
              <Select
                value={selectedValues}
                onValueChange={(value) => {
                  setSelectedValues(value);
                }}
              >
                <SelectTrigger className="mt-2 sm:py-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full sm:py-1">
              Apply
            </Button>
            {columnFilterLabels && columnFilterLabels.length > 0 && (
              <Button
                variant="secondary"
                className="w-full sm:py-1"
                type="button"
                onClick={() => {
                  column?.setFilterValue('');
                  setSelectedValues('');
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

type FilterCheckboxProps<TData, TValue> = SharedFilterProps<TData, TValue>;

function FilterCheckbox<TData, TValue>({
  column,
  title,
  options,
}: FilterCheckboxProps<TData, TValue>) {
  const columnFilters = column?.getFilterValue() as string[];
  const [selectedValues, setSelectedValues] = React.useState<string[]>(
    columnFilters || [],
  );
  const [open, setOpen] = React.useState(false);

  const columnFilterLabels = React.useMemo(() => {
    if (!selectedValues || selectedValues.length === 0) return undefined;
    return selectedValues;
  }, [selectedValues]);

  React.useEffect(() => {
    setSelectedValues(columnFilters || []);
  }, [columnFilters]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-x-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1.5 font-medium text-muted-foreground hover:bg-muted sm:w-fit sm:text-xs',
            selectedValues && selectedValues.length > 0 ? '' : 'border-dashed',
            focusRing,
          )}
        >
          <span
            aria-hidden="true"
            onClick={(e) => {
              if (selectedValues && selectedValues.length > 0) {
                e.stopPropagation();
                column?.setFilterValue([]);
                setSelectedValues([]);
              }
            }}
          >
            <RiAddLine
              className={cn(
                '-ml-px size-5 shrink-0 transition sm:size-4',
                selectedValues &&
                  selectedValues.length > 0 &&
                  'rotate-45 hover:text-destructive',
              )}
              aria-hidden="true"
            />
          </span>
          {columnFilterLabels && columnFilterLabels.length > 0 ? (
            <span>{title}</span>
          ) : (
            <span className="w-full text-left sm:w-fit">{title}</span>
          )}
          {columnFilterLabels && columnFilterLabels.length > 0 && (
            <span className="h-4 w-px bg-border" aria-hidden="true" />
          )}
          <ColumnFiltersLabel
            columnFilterLabels={columnFilterLabels}
            className="w-full text-left sm:w-fit"
          />
          <RiArrowDownSLine
            className="size-5 shrink-0 text-muted-foreground sm:size-4"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={7}
        className="min-w-[calc(var(--radix-popover-trigger-width))] max-w-[calc(var(--radix-popover-trigger-width))] sm:min-w-56 sm:max-w-56"
        onInteractOutside={() => {
          if (!columnFilters || columnFilters.length === 0) {
            column?.setFilterValue([]);
            setSelectedValues([]);
          }
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            column?.setFilterValue(selectedValues);
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <div>
              <Label className="font-semibold text-base sm:text-sm">
                Filter by {title}
              </Label>
              <div className="mt-2 space-y-2 overflow-y-auto sm:max-h-40">
                {options.map((option) => {
                  return (
                    <div key={option.label} className="flex items-center gap-2">
                      <Checkbox
                        id={option.value}
                        checked={selectedValues?.includes(option.value)}
                        onCheckedChange={(checked) => {
                          setSelectedValues((prev) => {
                            if (checked) {
                              return prev
                                ? [...prev, option.value]
                                : [option.value];
                            }
                            return prev.filter(
                              (value) => value !== option.value,
                            );
                          });
                        }}
                      />
                      <Label
                        htmlFor={option.value}
                        className="text-base sm:text-sm"
                      >
                        {option.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button type="submit" className="w-full sm:py-1">
              Apply
            </Button>
            {columnFilterLabels && columnFilterLabels.length > 0 && (
              <Button
                variant="secondary"
                className="w-full sm:py-1"
                type="button"
                onClick={() => {
                  column?.setFilterValue([]);
                  setSelectedValues([]);
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

type FilterNumberProps<TData, TValue> = SharedFilterProps<TData, TValue> & {
  formatter?: (value: string | number) => string;
};

function FilterNumber<TData, TValue>({
  column,
  title,
  options,
  formatter = (value: string | number) => value.toString(),
}: FilterNumberProps<TData, TValue>) {
  const columnFilters = column?.getFilterValue() as ConditionFilter;
  const [selectedValues, setSelectedValues] = React.useState<ConditionFilter>(
    columnFilters || { condition: '', value: ['', ''] },
  );
  const [open, setOpen] = React.useState(false);

  const columnFilterLabels = React.useMemo(() => {
    if (!selectedValues || selectedValues.condition === '') return undefined;

    const condition = options.find(
      (option) => option.value === selectedValues.condition,
    )?.label;
    if (!condition) return undefined;
    if (!selectedValues.value?.[0] && !selectedValues.value?.[1])
      return [`${condition}`];
    if (!selectedValues.value?.[1])
      return [`${condition} ${formatter(selectedValues.value?.[0])}`];
    return [
      `${condition} ${formatter(selectedValues.value?.[0])} and ${formatter(
        selectedValues.value?.[1],
      )}`,
    ];
  }, [selectedValues, options, formatter]);

  React.useEffect(() => {
    setSelectedValues(columnFilters || { condition: '', value: ['', ''] });
  }, [columnFilters]);

  const isBetween = selectedValues?.condition === 'is-between';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-x-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1.5 font-medium text-muted-foreground hover:bg-muted sm:w-fit sm:text-xs',
            selectedValues && selectedValues.condition !== ''
              ? ''
              : 'border-dashed',
            focusRing,
          )}
        >
          <span
            aria-hidden="true"
            onClick={(e) => {
              if (selectedValues && selectedValues.condition !== '') {
                e.stopPropagation();
                column?.setFilterValue({ condition: '', value: ['', ''] });
                setSelectedValues({ condition: '', value: ['', ''] });
              }
            }}
          >
            <RiAddLine
              className={cn(
                '-ml-px size-5 shrink-0 transition sm:size-4',
                selectedValues &&
                  selectedValues.condition !== '' &&
                  'rotate-45 hover:text-destructive',
              )}
              aria-hidden="true"
            />
          </span>
          {columnFilterLabels && columnFilterLabels.length > 0 ? (
            <span>{title}</span>
          ) : (
            <span className="w-full text-left sm:w-fit">{title}</span>
          )}
          {columnFilterLabels && columnFilterLabels.length > 0 && (
            <span className="h-4 w-px bg-border" aria-hidden="true" />
          )}
          <ColumnFiltersLabel
            columnFilterLabels={columnFilterLabels}
            className="w-full text-left sm:w-fit"
          />
          <RiArrowDownSLine
            className="size-5 shrink-0 text-muted-foreground sm:size-4"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={7}
        className="min-w-[calc(var(--radix-popover-trigger-width))] max-w-[calc(var(--radix-popover-trigger-width))] sm:min-w-56 sm:max-w-56"
        onInteractOutside={() => {
          if (!columnFilters || columnFilters.condition === '') {
            column?.setFilterValue({ condition: '', value: ['', ''] });
            setSelectedValues({ condition: '', value: ['', ''] });
          }
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            column?.setFilterValue(selectedValues);
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <div>
              <Label className="font-medium text-base sm:text-sm">
                Filter by {title}
              </Label>
              <div className="space-y-2">
                <Select
                  value={selectedValues?.condition}
                  onValueChange={(value) => {
                    setSelectedValues((prev) => {
                      return {
                        condition: value,
                        value: [value !== '' ? prev?.value?.[0] || '' : '', ''],
                      };
                    });
                  }}
                >
                  <SelectTrigger className="mt-2 sm:py-1">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex w-full items-center gap-2">
                  <RiCornerDownRightLine
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    disabled={!selectedValues?.condition}
                    type="number"
                    placeholder="$0"
                    className="sm:[&>input]:py-1"
                    value={selectedValues?.value?.[0] || ''}
                    onChange={(e) => {
                      setSelectedValues((prev) => {
                        return {
                          condition: prev?.condition || '',
                          value: [
                            e.target.value,
                            isBetween ? prev?.value?.[1] || '' : '',
                          ],
                        };
                      });
                    }}
                  />
                  {selectedValues?.condition === 'is-between' && (
                    <>
                      <span className="font-medium text-muted-foreground text-xs">
                        and
                      </span>
                      <Input
                        disabled={!selectedValues?.condition}
                        type="number"
                        placeholder="$0"
                        className="sm:[&>input]:py-1"
                        value={selectedValues?.value?.[1] || ''}
                        onChange={(e) => {
                          setSelectedValues((prev) => {
                            return {
                              condition: prev?.condition || '',
                              value: [prev?.value?.[0] || '', e.target.value],
                            };
                          });
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full sm:py-1">
              Apply
            </Button>
            {columnFilterLabels && columnFilterLabels.length > 0 && (
              <Button
                variant="secondary"
                className="w-full sm:py-1"
                type="button"
                onClick={() => {
                  column?.setFilterValue({ condition: '', value: ['', ''] });
                  setSelectedValues({ condition: '', value: ['', ''] });
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export {
  FilterCheckbox,
  FilterClear,
  FilterNumber,
  FilterSearch,
  FilterSelect,
};
