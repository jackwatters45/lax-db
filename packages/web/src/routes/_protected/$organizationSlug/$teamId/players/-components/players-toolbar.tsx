import type { TeamPlayerWithInfo } from '@lax-db/core/player/player.schema';
import { createFileRoute } from '@tanstack/react-router';
import type { Table } from '@tanstack/react-table';
import { Mail } from 'lucide-react';
import {
  BulkEditProvider,
  BulkEditToolbar,
  BulkEditToolbarActions,
  BulkEditToolbarCopyAction,
  BulkEditToolbarDeleteAction,
  BulkEditToolbarRemoveAction,
  BulkEditToolbarSelection,
  BulkEditToolbarSeparator,
} from '@/components/data-table/data-table-bulk-edit-toolbar';
import { useDataTable } from '@/components/data-table/use-data-table';
import { usePlayerMutations } from '../-mutations';

const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players/'
)();

const getPlayerIds = (table: Table<TeamPlayerWithInfo>) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  return selectedRows.map((row) => row.original.publicId);
};

export function PlayersToolbar() {
  const { teamId } = Route.useParams();
  const { activeOrganization } = Route.useRouteContext();

  const { table } = useDataTable<TeamPlayerWithInfo>();
  const rowSelection = table.getState().rowSelection;

  const { bulkDelete, bulkRemove } = usePlayerMutations(
    activeOrganization.id,
    teamId
  );

  const onDelete = () => {
    const playerIds = getPlayerIds(table);
    bulkDelete.mutate({ playerIds });
    table.resetRowSelection();
  };

  const onRemove = () => {
    const playerIds = getPlayerIds(table);
    bulkRemove.mutate({ playerIds, teamId });
    table.resetRowSelection();
  };

  return (
    <BulkEditProvider
      actions={{ onDelete, onRemove }}
      rowSelection={rowSelection}
      table={table}
    >
      <BulkEditToolbar>
        <BulkEditToolbarSelection />
        <BulkEditToolbarSeparator />
        <BulkEditToolbarActions>
          <BulkEditToolbarCopyAction
            columnId="email"
            icon={Mail}
            tooltipContent="Copy Emails"
          />
          <BulkEditToolbarSeparator />
          <BulkEditToolbarRemoveAction tooltipContent="Remove From Team" />
          <BulkEditToolbarDeleteAction />
        </BulkEditToolbarActions>
      </BulkEditToolbar>
    </BulkEditProvider>
  );
}
