import { Plus } from 'lucide-react';
import {
  FilterActions,
  FilterBar,
  FilterBarDisplayTypeToggle,
  FilterBarProvider,
  FilterBarViewOptions,
  FilterCheckbox,
  FilterClear,
  FilterGroup,
  FilterSearch,
} from '@/components/data-table/data-table-filterbar';
import { useDataTable } from '@/components/data-table/use-data-table';
import { Button } from '@/components/ui/button';
import { POSITION_SELECT_FIELDS } from '@/lib/constants';
import { AddPlayerCommand } from './add-player-command';

export function PlayersFilterBar({
  organizationId,
  teamId,
  excludePlayerIds,
}: {
  organizationId: string;
  teamId: string;
  excludePlayerIds: string[];
}) {
  const { table } = useDataTable();

  return (
    <FilterBarProvider table={table}>
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
          <AddPlayerCommand
            organizationId={organizationId}
            teamId={teamId}
            excludePlayerIds={excludePlayerIds}
          >
            <Button size="sm">
              <Plus className="size-4" />
              <span className="hidden lg:block">Add Player</span>
            </Button>
          </AddPlayerCommand>
        </FilterActions>
      </FilterBar>
    </FilterBarProvider>
  );
}
