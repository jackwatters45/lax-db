import type { Player } from '@lax-db/core/player/player.sql';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S, Schema } from 'effect';
import { UserPlus } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { authMiddleware } from '@/lib/middleware';

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

const SearchSchema = S.Struct({
  query: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Search query is required' }),
  ),
});

const searchPlayers = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof SearchSchema.Type) =>
    S.decodeSync(SearchSchema)(data),
  )
  .handler(async ({ data: { query } }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.search(query);
  });

const AddPlayerToTeamSchema = S.Struct({
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
// type AddPlayerToTeamFormValues = typeof AddPlayerToTeamSchema.Type;

const TeamIdSchema = Schema.String;

const addPlayerToTeam = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    (data: {
      formData: typeof AddPlayerToTeamSchema.Type;
      teamId: typeof TeamIdSchema.Type;
    }) => {
      const formDataDecoded = S.decodeSync(AddPlayerToTeamSchema)(
        data.formData,
      );
      const teamIdDecoded = S.decodeSync(TeamIdSchema)(data.teamId);

      return {
        formData: formDataDecoded,
        teamId: teamIdDecoded,
      };
    },
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

const RemovePlayerFromTeamSchema = S.Struct({
  teamId: S.String,
  playerId: S.String,
});
const removePlayerFromTeam = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof RemovePlayerFromTeamSchema.Type) =>
    S.decodeSync(RemovePlayerFromTeamSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.removePlayerFromTeam(data.teamId, data.playerId);
  });

const DeletePlayerSchema = S.Struct({
  playerId: S.String,
});
const deletePlayer = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: typeof DeletePlayerSchema.Type) =>
    S.decodeSync(DeletePlayerSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.deletePlayer(data.playerId);
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
        const results = await searchPlayers({
          data: { query: searchQuery },
        });
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

export { addPlayerToTeam, removePlayerFromTeam, deletePlayer, type TempPlayer };
