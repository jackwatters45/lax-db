import { Link } from '@tanstack/react-router';
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { User2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
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
import { deletePlayer, removePlayerFromTeam } from './player-edit-ui';

type PlayerWithTeamInfo = {
  id: string;
  playerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  jerseyNumber: number | null;
  position: string | null;
  isNew?: boolean;
};

const columnHelper = createColumnHelper<PlayerWithTeamInfo>();

type EditablePlayerColumnsProps = {
  organizationSlug: string;
  teamId: string;
  actions: {
    setPlayers: React.Dispatch<React.SetStateAction<PlayerWithTeamInfo[]>>;
    onSave: (id: string, data: PlayerWithTeamInfo) => Promise<void>;
  };
};

export function createEditablePlayerColumns({
  organizationSlug,
  teamId,
  actions: { onSave, setPlayers },
}: EditablePlayerColumnsProps): ColumnDef<PlayerWithTeamInfo>[] {
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
          onCheckedChange={(checked) => {
            console.log({ checked });
            row.toggleSelected();
            console.log({ IsSelected: row.getIsSelected() });
          }}
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
              onSave(player.id, { ...player, jerseyNumber: value });
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
        return (
          <Input
            variant="data"
            defaultValue={player.name}
            onBlur={(e) => {
              const value = e.target.value;
              onSave(player.id, { ...player, name: value });
            }}
            placeholder="Player name"
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
              onSave(player.id, { ...player, position: value });
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
              onSave(player.id, { ...player, email: value });
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
        const [_removeDialogOpen, setRemoveDialogOpen] = useState(false);
        const [_deleteDialogOpen, setDeleteDialogOpen] = useState(false);

        const _handleRemoveFromTeam = async () => {
          try {
            await removePlayerFromTeam({
              data: { teamId, playerId: player.playerId },
            });
            // Trigger data refresh - you might want to pass this as a prop
            window.location.reload();
          } catch (error) {
            console.error('Error removing player from team:', error);
          }
          setRemoveDialogOpen(false);
        };

        const _handleDeletePlayer = async () => {
          try {
            await deletePlayer({ data: { playerId: player.playerId } });
            // Trigger data refresh - you might want to pass this as a prop
            setPlayers((prev) => prev.filter((p) => p.id !== player.playerId));
          } catch (error) {
            console.error('Error deleting player:', error);
          }
          setDeleteDialogOpen(false);
        };

        return (
          <RowActionsProvider
            row={row}
            actions={{
              onDelete: () => setDeleteDialogOpen(true),
              onRemove: () => setRemoveDialogOpen(true),
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
  ] as ColumnDef<PlayerWithTeamInfo>[];
}

export type { PlayerWithTeamInfo };
