'use client';

import {
  RiAddLine,
  RiArrowDownSLine,
  RiCornerDownRightLine,
} from '@remixicon/react';
import type { Column, Table } from '@tanstack/react-table';
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

export type ConditionFilter = {
  condition: string;
  value: [number | string, number | string];
};

type FilterType = 'select' | 'checkbox' | 'number';
type FilterValues = string | string[] | ConditionFilter | undefined;

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

interface FilterGroupProps {
  children: React.ReactNode;
  className?: string;
}

interface FilterSearchProps<TData> {
  table: Table<TData>;
  column: string;
  placeholder?: string;
  className?: string;
}

interface FilterClearProps<TData> {
  table: Table<TData>;
  className?: string;
}

interface FilterSelectProps<TData, TValue> {
  column: Column<TData, TValue> | undefined;
  title?: string;
  options: {
    label: string;
    value: string;
  }[];
}

interface FilterCheckboxProps<TData, TValue> {
  column: Column<TData, TValue> | undefined;
  title?: string;
  options: {
    label: string;
    value: string;
  }[];
}

interface FilterNumberProps<TData, TValue> {
  column: Column<TData, TValue> | undefined;
  title?: string;
  options: {
    label: string;
    value: string;
  }[];
  formatter?: (value: string | number) => string;
}

interface FilterItemProps<TData, TValue> {
  column: Column<TData, TValue> | undefined;
  title?: string;
  options?: {
    label: string;
    value: string;
  }[];
  type?: FilterType;
  formatter?: (value: string | number) => string;
}

const ColumnFiltersLabel = ({
  columnFilterLabels,
  className,
}: {
  columnFilterLabels: string[] | undefined;
  className?: string;
}) => {
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

function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 sm:gap-x-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

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

function FilterSearch<TData>({
  table,
  column,
  placeholder = 'Search...',
  className,
}: FilterSearchProps<TData>) {
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

function FilterClear<TData>({ table, className }: FilterClearProps<TData>) {
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

function FilterActions({ children, className }: FilterGroupProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>{children}</div>
  );
}

function FilterItem<TData, TValue>({
  column,
  title,
  options,
  type = 'select',
  formatter = (value: string | number) => value.toString(),
}: FilterItemProps<TData, TValue>) {
  const columnFilters = column?.getFilterValue() as FilterValues;

  const [selectedValues, setSelectedValues] =
    React.useState<FilterValues>(columnFilters);
  const [open, setOpen] = React.useState(false);

  const columnFilterLabels = React.useMemo(() => {
    if (!selectedValues) return undefined;

    if (Array.isArray(selectedValues)) {
      return selectedValues.map((value) => formatter(value));
    }

    if (typeof selectedValues === 'string') {
      return [formatter(selectedValues)];
    }

    if (typeof selectedValues === 'object' && 'condition' in selectedValues) {
      const condition = options?.find(
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
    }

    return undefined;
  }, [selectedValues, options, formatter]);

  const getDisplayedFilter = () => {
    switch (type) {
      case 'select':
        return (
          <Select
            value={selectedValues as string}
            onValueChange={(value) => {
              setSelectedValues(value);
            }}
          >
            <SelectTrigger className="mt-2 sm:py-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {options?.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="mt-2 space-y-2 overflow-y-auto sm:max-h-36">
            {options?.map((option) => {
              return (
                <div key={option.label} className="flex items-center gap-2">
                  <Checkbox
                    id={option.value}
                    checked={(selectedValues as string[])?.includes(
                      option.value,
                    )}
                    onCheckedChange={(checked) => {
                      setSelectedValues((prev) => {
                        if (checked) {
                          return prev
                            ? [...(prev as string[]), option.value]
                            : [option.value];
                        }
                        return (prev as string[]).filter(
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
        );
      case 'number': {
        const isBetween =
          (selectedValues as ConditionFilter)?.condition === 'is-between';
        return (
          <div className="space-y-2">
            <Select
              value={(selectedValues as ConditionFilter)?.condition}
              onValueChange={(value) => {
                setSelectedValues((prev) => {
                  return {
                    condition: value,
                    value: [
                      value !== '' ? (prev as ConditionFilter)?.value?.[0] : '',
                      '',
                    ],
                  };
                });
              }}
            >
              <SelectTrigger className="mt-2 sm:py-1">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {options?.map((item) => (
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
                disabled={!(selectedValues as ConditionFilter)?.condition}
                type="number"
                placeholder="$0"
                className="sm:[&>input]:py-1"
                value={(selectedValues as ConditionFilter)?.value?.[0]}
                onChange={(e) => {
                  setSelectedValues((prev) => {
                    return {
                      condition: (prev as ConditionFilter)?.condition,
                      value: [
                        e.target.value,
                        isBetween ? (prev as ConditionFilter)?.value?.[1] : '',
                      ],
                    };
                  });
                }}
              />
              {(selectedValues as ConditionFilter)?.condition ===
                'is-between' && (
                <>
                  <span className="font-medium text-muted-foreground text-xs">
                    and
                  </span>
                  <Input
                    disabled={!(selectedValues as ConditionFilter)?.condition}
                    type="number"
                    placeholder="$0"
                    className="sm:[&>input]:py-1"
                    value={(selectedValues as ConditionFilter)?.value?.[1]}
                    onChange={(e) => {
                      setSelectedValues((prev) => {
                        return {
                          condition: (prev as ConditionFilter)?.condition,
                          value: [
                            (prev as ConditionFilter)?.value?.[0],
                            e.target.value,
                          ],
                        };
                      });
                    }}
                  />
                </>
              )}
            </div>
          </div>
        );
      }
    }
  };

  React.useEffect(() => {
    setSelectedValues(columnFilters);
  }, [columnFilters]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-x-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1.5 font-medium text-muted-foreground hover:bg-muted sm:w-fit sm:text-xs',
            selectedValues &&
              ((typeof selectedValues === 'object' &&
                'condition' in selectedValues &&
                selectedValues.condition !== '') ||
                (typeof selectedValues === 'string' && selectedValues !== '') ||
                (Array.isArray(selectedValues) && selectedValues.length > 0))
              ? ''
              : 'border-dashed',
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
          if (
            !columnFilters ||
            (typeof columnFilters === 'string' && columnFilters === '') ||
            (Array.isArray(columnFilters) && columnFilters.length === 0) ||
            (typeof columnFilters === 'object' &&
              'condition' in columnFilters &&
              columnFilters.condition === '')
          ) {
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
              {getDisplayedFilter()}
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
                  setSelectedValues(
                    type === 'checkbox'
                      ? []
                      : type === 'number'
                        ? { condition: '', value: ['', ''] }
                        : '',
                  );
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

// Individual filter components
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
              <Label className="font-medium text-base sm:text-sm">
                Filter by {title}
              </Label>
              <div className="mt-2 space-y-2 overflow-y-auto sm:max-h-36">
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
  FilterBar,
  FilterGroup,
  FilterSearch,
  FilterClear,
  FilterActions,
  FilterItem,
  FilterSelect,
  FilterCheckbox,
  FilterNumber,
};
