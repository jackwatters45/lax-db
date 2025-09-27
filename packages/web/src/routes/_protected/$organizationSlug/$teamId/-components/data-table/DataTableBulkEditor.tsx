import { RiCloseLine, RiDeleteBinLine, RiEditLine } from '@remixicon/react';
import type { RowSelectionState, Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';

type DataTableBulkEditorProps<TData> = {
  table: Table<TData>;
  rowSelection: RowSelectionState;
};

function DataTableBulkEditor<TData>({
  table,
  rowSelection,
}: DataTableBulkEditorProps<TData>) {
  const hasSelectedRows = Object.keys(rowSelection).length > 0;

  if (!hasSelectedRows) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-2">
      <span className="text-muted-foreground text-sm">
        {Object.keys(rowSelection).length} selected
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log('Edit');
          }}
          className="h-8 px-2"
        >
          <RiEditLine className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log('Delete');
          }}
          className="h-8 px-2 text-destructive hover:text-destructive"
        >
          <RiDeleteBinLine className="size-4" />
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            table.resetRowSelection();
          }}
          className="h-8 px-2"
        >
          <RiCloseLine className="size-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}

export { DataTableBulkEditor };
