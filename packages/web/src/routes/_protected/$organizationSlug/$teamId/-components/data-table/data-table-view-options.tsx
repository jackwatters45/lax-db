import { RiEqualizer2Line } from '@remixicon/react';
import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

function ViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const columns = table.getAllColumns();

  return (
    <div>
      <div className="flex justify-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto hidden gap-x-2 px-2 py-1.5 text-sm sm:text-xs lg:flex"
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

export { ViewOptions };
