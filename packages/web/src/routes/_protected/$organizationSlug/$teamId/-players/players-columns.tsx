import { type ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import {
  addPlayerToTeam,
  deletePlayer,
  PlayerActionButtons,
  PlayerEditCell,
  PlayerSearchCommand,
  removePlayerFromTeam,
  type TempPlayer,
} from './player-edit-ui';

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

export function createPlayerColumns(teamId: string, onDataChange: () => void) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TempPlayer>>({});

  const handleEdit = (player: PlayerWithTeamInfo) => {
    setEditingId(player.id);
    setEditData({
      name: player.name,
      email: player.email,
      phone: player.phone,
      dateOfBirth: player.dateOfBirth,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      isNew: 'isNew' in player ? player.isNew : false,
    });
  };

  const handleSave = async () => {
    if (!editingId || !editData) return;

    try {
      if ('isNew' in editData && editData.isNew) {
        await addPlayerToTeam({
          data: {
            formData: {
              name: editData.name || '',
              email: editData.email || undefined,
              phone: editData.phone || undefined,
              dateOfBirth: editData.dateOfBirth || undefined,
              jerseyNumber: editData.jerseyNumber || undefined,
              position: editData.position || undefined,
            },
            teamId,
          },
        });
        onDataChange();
      }
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Error saving player:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleRemoveFromTeam = async (playerId: string) => {
    if (confirm('Remove this player from the team?')) {
      try {
        await removePlayerFromTeam({ data: { teamId, playerId } });
        onDataChange();
      } catch (error) {
        console.error('Error removing player from team:', error);
      }
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm('Permanently delete this player? This cannot be undone.')) {
      try {
        await deletePlayer({ data: playerId });
        onDataChange();
      } catch (error) {
        console.error('Error deleting player:', error);
      }
    }
  };

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
        className: 'text-center w-16',
        displayName: 'Jersey Number',
      },
      cell: ({ row }) => {
        const player = row.original;
        const isEditing = editingId === player.id;

        return isEditing ? (
          <PlayerEditCell
            value={editData.jerseyNumber ?? null}
            onChange={(value) =>
              setEditData((prev) => ({
                ...prev,
                jerseyNumber: value as number,
              }))
            }
            type="number"
            placeholder="#"
          />
        ) : (
          <div className="text-center font-medium">
            {player.jerseyNumber || '-'}
          </div>
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
      cell: ({ row }) => {
        const player = row.original;
        const isEditing = editingId === player.id;

        return isEditing ? (
          <PlayerSearchCommand
            value={editData.name || ''}
            onSelect={(selectedPlayer) => {
              setEditData((prev) => ({
                ...prev,
                name: selectedPlayer.name,
                email: selectedPlayer.email,
                phone: selectedPlayer.phone,
                dateOfBirth: selectedPlayer.dateOfBirth,
              }));
            }}
            onCreateNew={(name) => {
              setEditData((prev) => ({
                ...prev,
                name,
              }));
            }}
          />
        ) : (
          <div className="font-medium">{player.name}</div>
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
        const isEditing = editingId === player.id;

        return isEditing ? (
          <PlayerEditCell
            value={editData.position ?? null}
            onChange={(value) =>
              setEditData((prev) => ({ ...prev, position: value as string }))
            }
            type="position"
          />
        ) : (
          <div className="text-muted-foreground">{player.position || '-'}</div>
        );
      },
    }),
    columnHelper.accessor('email', {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        className: 'text-left',
        displayName: 'Email',
      },
      cell: ({ row }) => {
        const player = row.original;
        const isEditing = editingId === player.id;

        return isEditing ? (
          <PlayerEditCell
            value={editData.email ?? null}
            onChange={(value) =>
              setEditData((prev) => ({ ...prev, email: value as string }))
            }
            type="email"
            placeholder="email@example.com"
          />
        ) : (
          <div className="text-muted-foreground">{player.email || '-'}</div>
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
        const isEditing = editingId === player.id;

        return (
          <PlayerActionButtons
            isEditing={isEditing}
            onEdit={() => handleEdit(player)}
            onSave={handleSave}
            onCancel={handleCancel}
            onRemoveFromTeam={handleRemoveFromTeam}
            onDelete={handleDeletePlayer}
            playerId={player.playerId}
          />
        );
      },
    }),
  ] as ColumnDef<PlayerWithTeamInfo>[];
}

export type { PlayerWithTeamInfo };
