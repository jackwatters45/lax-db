import type { TeamPlayerWithInfo } from '@lax-db/core/player/player.schema';
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

const columnHelper = createColumnHelper<TeamPlayerWithInfo>();

type EditablePlayerColumnsProps = {
  organizationId: string;
  organizationSlug: string;
  teamId: string;
};

export function createEditablePlayerColumns({
  organizationId,
  organizationSlug,
  teamId,
}: EditablePlayerColumnsProps) {
  return [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : false
          }
          className="translate-y-0.5"
          onCheckedChange={() => table.toggleAllPageRowsSelected()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="translate-y-0.5"
          onCheckedChange={() => row.toggleSelected()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        displayName: 'Select',
      },
    }),
  ] as ColumnDef<TeamPlayerWithInfo>[];
}
