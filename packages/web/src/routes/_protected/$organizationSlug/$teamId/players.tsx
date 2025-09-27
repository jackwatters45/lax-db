import type { Player } from '@lax-db/core/player/player.sql';
import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema } from 'effect';
import {
  Check,
  Edit2,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { authMiddleware } from '@/lib/middleware';
import { TeamHeader } from './-components/team-header';

const addPlayerToTeamSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Name is required' }),
  ),
  email: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String),
  dateOfBirth: Schema.optional(Schema.String),
  // Team-specific fields
  jerseyNumber: Schema.optional(
    Schema.Number.pipe(
      Schema.int({ message: () => 'Number must be an integer' }),
      Schema.positive({ message: () => 'Number must be positive' }),
    ),
  ),
  position: Schema.optional(Schema.String),
});

type AddPlayerToTeamFormValues = typeof addPlayerToTeamSchema.Type;

// Temporary player type for new rows
type TempPlayer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  jerseyNumber: number | null;
  position: string | null;
  isNew?: boolean;
};

const getTeamPlayers = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((teamId: string) => teamId)
  .handler(async ({ data: teamId }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.getTeamPlayers(teamId);
  });

const searchPlayers = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((query: string) => query)
  .handler(async ({ data: query }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.search(query);
  });

const addPlayerToTeam = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    (data: { formData: AddPlayerToTeamFormValues; teamId: string }) => data,
  )
  .handler(async ({ data: { formData, teamId } }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');

    // First create the player
    const player = await PlayerAPI.create({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
    });

    // Then add them to the team
    await PlayerAPI.addPlayerToTeam({
      playerId: player.id,
      teamId,
      jerseyNumber: formData.jerseyNumber,
      position: formData.position,
    });

    return player;
  });

const removePlayerFromTeam = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { teamId: string; playerId: string }) => data)
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.removePlayerFromTeam(data.teamId, data.playerId);
  });

const deletePlayer = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((playerId: string) => playerId)
  .handler(async ({ data: playerId }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.deletePlayer(playerId);
  });

export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const players = await getTeamPlayers({ data: params.teamId });
    return { players };
  },
});

function RouteComponent() {
  const { players: initialPlayers } = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const [players, setPlayers] = useState<any[]>(initialPlayers); // Use any[] for now due to complex joined type
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TempPlayer>>({});

  const handleAddPlayer = () => {
    const newPlayer: TempPlayer = {
      id: `temp-${Date.now()}`,
      name: '',
      email: null,
      phone: null,
      dateOfBirth: null,
      jerseyNumber: null,
      position: null,
      isNew: true,
    };
    setPlayers((prev) => [...prev, newPlayer]);
    setEditingId(newPlayer.id);
    setEditData(newPlayer);
  };

  const handleEdit = (player: any) => {
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
      const playerToUpdate = players.find((p) => p.id === editingId);
      if (playerToUpdate && 'isNew' in playerToUpdate && playerToUpdate.isNew) {
        // Save new player
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
        // Refresh to get the actual player from DB
        window.location.reload();
      } else {
        // Update existing player (would need update API)
        setPlayers((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...editData } : p)),
        );
      }
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Error saving player:', error);
    }
  };

  const handleCancel = () => {
    const playerToCancel = players.find((p) => p.id === editingId);
    if (playerToCancel && 'isNew' in playerToCancel && playerToCancel.isNew) {
      // Remove new unsaved player
      setPlayers((prev) => prev.filter((p) => p.id !== editingId));
    }
    setEditingId(null);
    setEditData({});
  };

  const handleRemoveFromTeam = async (playerId: string) => {
    if (confirm('Remove this player from the team?')) {
      try {
        await removePlayerFromTeam({ data: { teamId, playerId } });
        setPlayers((prev) => prev.filter((p) => p.playerId !== playerId));
      } catch (error) {
        console.error('Error removing player from team:', error);
      }
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm('Permanently delete this player? This cannot be undone.')) {
      try {
        await deletePlayer({ data: playerId });
        setPlayers((prev) => prev.filter((p) => p.playerId !== playerId));
      } catch (error) {
        console.error('Error deleting player:', error);
      }
    }
  };

  return (
    <>
      <Header />
      <div className="container mt-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-semibold text-2xl">Players</h2>
          <div className="flex items-center gap-4">
            <div className="text-muted-foreground text-sm">
              {players.length} players
            </div>
            <Button onClick={handleAddPlayer}>
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length > 0 ? (
                players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      {editingId === player.id ? (
                        <Input
                          type="number"
                          value={editData.jerseyNumber || ''}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              jerseyNumber: Number(e.target.value),
                            }))
                          }
                          className="w-16"
                          placeholder="#"
                        />
                      ) : (
                        <div className="font-medium">
                          {player.jerseyNumber || '-'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === player.id ? (
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
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === player.id ? (
                        <Select
                          value={editData.position || ''}
                          onValueChange={(value) =>
                            setEditData((prev) => ({
                              ...prev,
                              position: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Attack">Attack</SelectItem>
                            <SelectItem value="Midfield">Midfield</SelectItem>
                            <SelectItem value="Defense">Defense</SelectItem>
                            <SelectItem value="Goalie">Goalie</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-muted-foreground">
                          {player.position}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === player.id ? (
                        <Input
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="email@example.com"
                        />
                      ) : (
                        <div className="text-muted-foreground">
                          {player.email || '-'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === player.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSave}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(player)}
                            className="h-8 w-8 p-0"
                            title="Edit player"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleRemoveFromTeam(player.playerId)
                            }
                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                            title="Remove from team"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePlayer(player.playerId)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Delete player permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No players found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();
  const { activeTeam } = Route.useRouteContext();

  return (
    <TeamHeader organizationSlug={organizationSlug} activeTeam={activeTeam}>
      <BreadcrumbItem>
        <BreadcrumbLink className="max-w-full truncate" title="Teams" asChild>
          <Link to="/$organizationSlug" params={{ organizationSlug }}>
            Teams
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink title={activeTeam.name} asChild>
          <Link
            to="/$organizationSlug/$teamId"
            params={{ organizationSlug, teamId: activeTeam.id }}
          >
            {activeTeam.name}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink title="Players" asChild>
          <Link
            to="/$organizationSlug/$teamId/players"
            params={{ organizationSlug, teamId: activeTeam.id }}
          >
            Players
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </TeamHeader>
  );
}

function PlayerSearchCommand({
  value,
  onSelect,
  onCreateNew,
}: {
  value: string;
  onSelect: (player: Player) => void;
  onCreateNew: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchPlayers({ data: searchQuery });
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || 'Search or add player...'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search players..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isSearching ? (
                'Searching...'
              ) : (
                <div className="p-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onCreateNew(searchQuery);
                      setOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create "{searchQuery}"
                  </Button>
                </div>
              )}
            </CommandEmpty>
            {searchResults.length > 0 && (
              <CommandGroup heading="Existing Players">
                {searchResults.map((player) => (
                  <CommandItem
                    key={player.id}
                    onSelect={() => {
                      onSelect(player);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{player.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {player.email || 'No email'} •{' '}
                        {player.phone || 'No phone'}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {searchQuery && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onCreateNew(searchQuery);
                    setOpen(false);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create "{searchQuery}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
