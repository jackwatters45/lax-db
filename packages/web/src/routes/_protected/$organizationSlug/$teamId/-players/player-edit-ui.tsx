import type { Player } from '@lax-db/core/player/player.sql';
import { createServerFn } from '@tanstack/react-start';
import { Schema } from 'effect';
import { Check, Edit2, Trash2, UserMinus, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { authMiddleware } from '@/lib/middleware';

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

export function PlayerSearchCommand({
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
          aria-expanded={open}
          aria-haspopup="listbox"
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

export function PlayerEditCell({
  value,
  onChange,
  type,
  placeholder,
}: {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  type: 'text' | 'email' | 'number' | 'position';
  placeholder?: string;
}) {
  if (type === 'position') {
    return (
      <Select
        value={value?.toString() || ''}
        onValueChange={(val) => onChange(val)}
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
    );
  }

  return (
    <Input
      type={type}
      value={value?.toString() || ''}
      onChange={(e) => {
        const val = e.target.value;
        onChange(type === 'number' ? Number(val) : val);
      }}
      placeholder={placeholder}
      className={type === 'number' ? 'w-16' : ''}
    />
  );
}

export function PlayerActionButtons({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onRemoveFromTeam,
  onDelete,
  playerId,
}: {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onRemoveFromTeam: (playerId: string) => void;
  onDelete: (playerId: string) => void;
  playerId: string;
}) {
  if (isEditing) {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onSave}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={onEdit}
        className="h-8 w-8 p-0"
        title="Edit player"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onRemoveFromTeam(playerId)}
        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
        title="Remove from team"
      >
        <UserMinus className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDelete(playerId)}
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        title="Delete player permanently"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export {
  addPlayerToTeam,
  removePlayerFromTeam,
  deletePlayer,
  type AddPlayerToTeamFormValues,
  type TempPlayer,
};
