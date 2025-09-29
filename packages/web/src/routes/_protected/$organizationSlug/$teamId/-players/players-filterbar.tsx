import type { Table } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import {
  FilterActions,
  FilterBar,
  FilterBarAddButton,
  FilterbarProvider,
  FilterbarViewOptions,
  FilterCheckbox,
  FilterClear,
  FilterGroup,
  FilterSearch,
} from '@/components/data-table/data-table-filterbar';
import { useDataTable } from '../../../../../components/data-table/data-table';
import type { PlayerWithTeamInfo } from './players-columns';

export interface PlayerDataTableToolbarProps {
  table: Table<PlayerWithTeamInfo>;
}

const positions = [
  { label: 'Attack', value: 'Attack' },
  { label: 'Midfield', value: 'Midfield' },
  { label: 'Face-off', value: 'Face-off' },
  { label: 'Long Stick Midfield', value: 'Long Stick Midfield' },
  { label: 'Defense', value: 'Defense' },
  { label: 'Goalie', value: 'Goalie' },
];

export function PlayersFilterbar() {
  const { table } = useDataTable();

  return (
    <FilterbarProvider
      table={table}
      actions={{
        onAdd: () => {},
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
              options={positions}
            />
          )}
          <FilterClear />
        </FilterGroup>
        <FilterActions>
          <FilterbarViewOptions />
          <FilterBarAddButton>
            <Plus className="size-4" />
            Add Player
          </FilterBarAddButton>
        </FilterActions>
      </FilterBar>
    </FilterbarProvider>
  );
}
