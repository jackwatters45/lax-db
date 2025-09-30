import type { TeamPlayerWithInfo } from '@lax-db/core/player/index';
import type { PartialNullable } from '@lax-db/core/types';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { POSITION_SELECT_FIELDS } from '@/lib/constants';
import { PlayerSearchCombobox } from './player-edit-ui';

const columnHelper = createColumnHelper<TeamPlayerWithInfo>();

type EditablePlayerColumnsProps = {
  organizationSlug: string;
  teamPlayers: TeamPlayerWithInfo[];
  actions: {
    onUpdate: (
      playerId: string,
      updates: PartialNullable<TeamPlayerWithInfo>,
    ) => void;
    onRemove: (playerId: string) => void;
    onDelete: (playerId: string) => void;
  };
};

export function createEditablePlayerColumns({
  organizationSlug,
  teamPlayers,
  actions: { onUpdate, onRemove, onDelete },
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
        return (
          <Input
            variant="data"
            type="number"
            defaultValue={player.jerseyNumber ?? ''}
            onBlur={(e) => {
              const value = e.target.value ? Number(e.target.value) : null;
              if (value !== player.jerseyNumber) {
                onUpdate(player.playerId, { jerseyNumber: value });
              }
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
      cell: ({ row: { original: player } }) => {
        const excludePlayerIds = teamPlayers.map((p) => p.playerId);

        return (
          <PlayerSearchCombobox
            organizationId={organizationSlug}
            value={player.name ?? ''}
            excludePlayerIds={excludePlayerIds}
            onSelect={(selectedPlayer) => {
              onUpdate(player.playerId, {
                name: selectedPlayer.name,
                email: selectedPlayer.email,
                phone: selectedPlayer.phone,
                dateOfBirth: selectedPlayer.dateOfBirth,
              });
            }}
            onRename={(name) => {
              onUpdate(player.playerId, { name });
            }}
            onCreateNew={(name) => {
              onUpdate(player.playerId, { name });
            }}
            placeholder="Search or add player..."
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

        return (
          <Select
            value={player.position || ''}
            onValueChange={(value) => {
              onUpdate(player.playerId, { position: value });
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
        return (
          <Input
            variant="data"
            type="email"
            defaultValue={player.email || ''}
            onBlur={(e) => {
              const value = e.target.value || null;
              if (value !== player.email) {
                onUpdate(player.playerId, { email: value });
              }
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

        return (
          <RowActionsProvider
            row={row}
            actions={{
              onDelete: () => onDelete(player.playerId),
              onRemove: () => onRemove(player.playerId),
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

export type { TeamPlayerWithInfo };
