import { useDataTable } from '@/components/data-table/data-table';
import {
  BulkEditProvider,
  BulkEditToolbar,
  BulkEditToolbarActions,
  BulkEditToolbarDeleteAction,
  BulkEditToolbarEditAction,
  BulkEditToolbarSelection,
  BulkEditToolbarSeparator,
} from '@/components/data-table/data-table-bulk-edit-toolbar';

export function PlayersToolbar() {
  const { table } = useDataTable();
  const rowSelection = table.getState().rowSelection;

  const onEdit = () => {
    // Implement edit functionality here
  };

  const onDelete = () => {
    // Implement delete functionality here
  };

  return (
    <BulkEditProvider
      table={table}
      rowSelection={rowSelection}
      actions={{
        onEdit: onEdit,
        onDelete: onDelete,
      }}
    >
      <BulkEditToolbar>
        <BulkEditToolbarSelection />
        <BulkEditToolbarSeparator />
        <BulkEditToolbarActions>
          <BulkEditToolbarEditAction />
          <BulkEditToolbarDeleteAction />
        </BulkEditToolbarActions>
      </BulkEditToolbar>
    </BulkEditProvider>
  );
}
