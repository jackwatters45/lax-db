'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type Table as TanstackTable,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  BulkEditProvider,
  BulkEditToolbar,
  BulkEditToolbarActions,
  BulkEditToolbarDeleteAction,
  BulkEditToolbarEditAction,
  BulkEditToolbarSelection,
  BulkEditToolbarSeparator,
} from './data-table-bulk-edit-toolbar';
import { Filterbar } from './data-table-filterbar';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  showAllRows?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  showAllRows = false,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const tableConfig = {
    data,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(showAllRows ? {} : { getPaginationRowModel: getPaginationRowModel() }),
  };

  const table = useReactTable(tableConfig);

  return (
    <div className="space-y-3">
      <div className="px-4">
        <Filterbar table={table} />
      </div>
      <div className="relative overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border border-y">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(header.column.columnDef.meta?.className)}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => row.toggleSelected(!row.getIsSelected())}
                  className="group select-none hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        row.getIsSelected() ? 'bg-muted/50' : '',
                        'relative whitespace-nowrap py-1 text-muted-foreground first:w-10',
                        cell.column.columnDef.meta?.className,
                      )}
                    >
                      {index === 0 && row.getIsSelected() && (
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
                      )}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/*<DataTableBulkEditor table={table} rowSelection={rowSelection} />*/}
        {/*<BulkEditToolbar
          table={table}
          rowSelection={rowSelection}
          onEdit={() => {}}
          onDelete={() => {}}
          actions={[
            {
              label: 'Duplicate',
              icon: Copy,
              onClick: () => {
                // Implement duplicate functionality here
              },
            },
          ]}
        />*/}
        <Toolbar table={table} rowSelection={rowSelection} />
      </div>
    </div>
  );
}

function Toolbar<TData>({
  table,
  rowSelection,
}: {
  table: TanstackTable<TData>;
  rowSelection: RowSelectionState;
}) {
  const _handleEdit = () => {
    // Implement edit functionality here
  };

  const _handleExport = () => {
    // Implement export functionality here
  };

  const _handleDelete = () => {
    // Implement delete functionality here
  };

  return (
    <BulkEditProvider
      table={table}
      rowSelection={rowSelection}
      actions={{
        onEdit: () => {},
        onDelete: () => {},
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
