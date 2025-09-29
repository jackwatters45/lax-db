import { Plus } from 'lucide-react';
import { useDataTable } from '@/components/data-table/data-table';
import {
  FilterActions,
  FilterBar,
  FilterBarAddButton,
  FilterBarDisplayTypeToggle,
  FilterBarProvider,
  FilterBarViewOptions,
  FilterCheckbox,
  FilterClear,
  FilterGroup,
  FilterSearch,
} from '@/components/data-table/data-table-filterbar';
import { POSITION_SELECT_FIELDS } from '@/lib/constants';

export function PlayersFilterBar({ onAddPlayer }: { onAddPlayer: () => void }) {
  const { table } = useDataTable();

  return (
    <FilterBarProvider
      table={table}
      actions={{
        onAdd: onAddPlayer,
      }}
    >
      <FilterBar>
        <FilterGroup>
          {table.getColumn('name')?.getIsVisible() && (
            <FilterSearch column="name" placeholder="Search by name..." />
          )}
          {table.getColumn('position')?.getIsVisible() && (
            <FilterCheckbox
              column={table.getColumn('position')}
              title="Position"
              options={POSITION_SELECT_FIELDS}
            />
          )}
          <FilterClear />
        </FilterGroup>
        <FilterActions>
          <FilterBarDisplayTypeToggle />
          <FilterBarViewOptions />
          <FilterBarAddButton>
            <Plus className="size-4" />
            <span className="hidden lg:block">Add Player</span>
          </FilterBarAddButton>
        </FilterActions>
      </FilterBar>
    </FilterBarProvider>
  );
}
