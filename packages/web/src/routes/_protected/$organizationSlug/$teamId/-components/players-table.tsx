import type { Player } from '@lax-db/core/player/player.sql';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const columns: ColumnDef<Player>[] = [
  {
    accessorKey: 'number',
    header: '#',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('number')}</div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'position',
    header: 'Position',
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue('position')}</div>
    ),
  },
  {
    accessorKey: 'age',
    header: 'Age',
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue('age')}</div>
    ),
  },
];

/**
 * Props for the PlayersTable component
 */
interface PlayersTableProps {
  /** Array of player data to display */
  data: Player[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * PlayersTable component that displays player information in a table format.
 *
 * Uses TanStack Table for data management and shadcn table components for styling.
 * Shows player number, name, position, and age in a clean tabular layout.
 *
 * @param props - The component props
 * @param props.data - Player data array
 * @param props.className - Additional CSS classes
 * @returns JSX element containing the players table
 */
export function PlayersTable({ data, className }: PlayersTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
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
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No players found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
