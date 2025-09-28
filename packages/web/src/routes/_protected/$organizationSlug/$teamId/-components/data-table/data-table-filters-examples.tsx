import type { Table } from '@tanstack/react-table';
import { formatters } from '@/lib/formatters';
import {
  conditions,
  regions,
  statuses,
} from '@/routes/_protected/$organizationSlug/settings/-data';
import {
  FilterActions,
  FilterBar,
  FilterCheckbox,
  FilterClear,
  FilterGroup,
  FilterNumber,
  FilterSearch,
  FilterSelect,
} from '../../../../../../components/data-table/data-table-filters';
import { ViewOptions } from '../../../../../../components/data-table/data-table-view-options';

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function Filterbar<TData>({ table }: DataTableToolbarProps<TData>) {
  return (
    <FilterBar>
      <FilterGroup>
        {table.getColumn('status')?.getIsVisible() && (
          <FilterSelect
            column={table.getColumn('status')}
            title="Status"
            options={statuses}
          />
        )}
        {table.getColumn('region')?.getIsVisible() && (
          <FilterCheckbox
            column={table.getColumn('region')}
            title="Region"
            options={regions}
          />
        )}
        {table.getColumn('costs')?.getIsVisible() && (
          <FilterNumber
            column={table.getColumn('costs')}
            title="Costs"
            options={conditions}
            formatter={formatters.currency}
          />
        )}
        <FilterClear table={table} />
        {table.getColumn('owner')?.getIsVisible() && (
          <FilterSearch
            table={table}
            column="owner"
            placeholder="Search by owner..."
          />
        )}
      </FilterGroup>
      <FilterActions>
        <div>
          <ViewOptions table={table} />
        </div>
      </FilterActions>
    </FilterBar>
  );
}
