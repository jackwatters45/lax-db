import type { TeamPlayerWithInfo } from '@lax-db/core/player/index';
import { Link } from '@tanstack/react-router';
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { User2 } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  RowActionDeleteItem,
  RowActionItem,
  RowActionRemoveItem,
  RowActionSeparator,
  RowActionsDropdown,
  RowActionsProvider,
} from '@/components/data-table/data-table-row-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { ControlledInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { POSITION_SELECT_FIELDS } from '@/lib/constants';
import { usePlayerMutations, useUpdatePlayer } from '../-mutations';
import { PlayerSearchCombobox } from './player-edit-ui';

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
}: EditablePlayerColumnsProps): ColumnDef<TeamPlayerWithInfo>[] {
  return [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={() => table.toggleAllPageRowsSelected()}
          className="translate-y-0.5"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={() => row.toggleSelected()}
          className="translate-y-0.5"
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        displayName: 'Select',
      },
    }),
    columnHelper.accessor('jerseyNumber', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="#" />
      ),
      enableSorting: true,
      meta: {
        className: 'w-16',
        displayName: 'Jersey Number',
      },
      cell: ({ row: { original: player } }) => {
        const { handleUpdate } = useUpdatePlayer(organizationId, teamId);

        return (
          <ControlledInput
            key={`jersey-${player.playerId}`}
            variant="data"
            type="number"
            value={player.jerseyNumber ?? ''}
            onUpdate={(newValue) => {
              const numValue = newValue ? Number(newValue) : null;
              handleUpdate(player.playerId, { jerseyNumber: numValue });
            }}
            placeholder="#"
          />
        );
      },
    }),
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      enableSorting: true,
      enableHiding: false,
      enableColumnFilter: true,
      meta: {
        className: 'text-left',
        displayName: 'Name',
      },
      cell: ({ row, table }) => {
        const player = row.original;
        const { handleUpdate } = useUpdatePlayer(organizationId, teamId);

        const excludePlayerIds = table.options.meta?.excludePlayerIds;

        return (
          <PlayerSearchCombobox
            organizationId={organizationSlug}
            value={player.name ?? ''}
            excludePlayerIds={excludePlayerIds ?? []}
            placeholder="Search or add player..."
            onSelect={(selectedPlayer) => {
              handleUpdate(player.playerId, {
                name: selectedPlayer.name,
                email: selectedPlayer.email,
                phone: selectedPlayer.phone,
                dateOfBirth: selectedPlayer.dateOfBirth,
              });
            }}
          />
        );
      },
    }),
    columnHelper.accessor('position', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Position" />
      ),
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        className: 'text-left',
        displayName: 'Position',
      },
      filterFn: 'arrIncludesSome',
      cell: ({ row }) => {
        const player = row.original;
        const { handleUpdate } = useUpdatePlayer(organizationId, teamId);

        return (
          <Select
            value={player.position || ''}
            onValueChange={(value) => {
              handleUpdate(player.playerId, { position: value });
            }}
          >
            <SelectTrigger variant="data">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {POSITION_SELECT_FIELDS.map((position) => (
                <SelectItem key={position.value} value={position.value}>
                  {position.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    }),
    columnHelper.accessor('email', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        className: 'text-left',
        displayName: 'Email',
      },
      cell: ({ row: { original: player } }) => {
        const { handleUpdate } = useUpdatePlayer(organizationId, teamId);

        return (
          <ControlledInput
            key={`email-${player.playerId}`}
            variant="data"
            type="email"
            value={player.email || ''}
            onUpdate={(newValue) => {
              handleUpdate(player.playerId, { email: newValue });
            }}
            placeholder="email@example.com"
          />
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      enableHiding: false,
      meta: {
        className: 'text-right w-32',
        displayName: 'Actions',
      },
      cell: ({ row }) => {
        const player = row.original;

        const mutations = usePlayerMutations(organizationId, teamId);

        return (
          <RowActionsProvider
            row={row}
            actions={{
              onDelete: () =>
                mutations.delete.mutate({ playerId: player.playerId }),
              onRemove: () =>
                mutations.remove.mutate({ teamId, playerId: player.playerId }),
            }}
          >
            <RowActionsDropdown>
              <Link
                to="/$organizationSlug/players/$playerId"
                params={{
                  organizationSlug: organizationSlug,
                  playerId: player.playerId,
                }}
              >
                <RowActionItem icon={User2}>View</RowActionItem>
              </Link>
              <RowActionRemoveItem
                alertTitle="Remove Player from Team"
                alertDescription="Are you sure you want to remove this player from the team?"
              >
                Remove From Team
              </RowActionRemoveItem>
              <RowActionSeparator />
              <RowActionDeleteItem
                alertTitle="Permanently Delete Player from Organization"
                alertDescription="Are you sure you want to remove this player from the organization? This action cannot be undone."
              >
                Delete Player
              </RowActionDeleteItem>
            </RowActionsDropdown>
          </RowActionsProvider>
        );
      },
    }),
  ] as ColumnDef<TeamPlayerWithInfo>[];
}
