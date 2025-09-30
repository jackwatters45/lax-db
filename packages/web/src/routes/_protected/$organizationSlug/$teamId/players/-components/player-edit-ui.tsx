import type { Player } from '@lax-db/core/player/player.sql';
import { useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { Schema as S } from 'effect';
import { Check, ChevronsUpDown, Edit, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { authMiddleware } from '@/lib/middleware';
import { cn } from '@/lib/utils';

const OrganizationIdSchema = S.Struct({
  organizationId: S.String,
});

export const getOrganizationPlayers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: typeof OrganizationIdSchema.Type) =>
    S.decodeSync(OrganizationIdSchema)(data),
  )
  .handler(async ({ data }) => {
    const { PlayerAPI } = await import('@lax-db/core/player/index');
    return await PlayerAPI.getAll({ organizationId: data.organizationId });
  });

export function PlayerSearchCombobox({
  organizationId,
  value,
  excludePlayerIds = [],
  onSelect,
  onRename,
  onCreateNew,
  placeholder = 'Search or add player...',
}: {
  organizationId: string;
  value?: string;
  excludePlayerIds?: string[];
  onSelect: (player: Player) => void;
  onRename: (name: string) => void;
  onCreateNew: (name: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allPlayers = [], isLoading } = useQuery({
    queryKey: ['organization-players', organizationId],
    queryFn: () => getOrganizationPlayers({ data: { organizationId } }),
  });

  const filteredPlayers = useMemo(() => {
    const availablePlayers = allPlayers.filter(
      (player) => !excludePlayerIds.includes(player.id),
    );

    if (!searchQuery.trim()) return availablePlayers;

    const query = searchQuery.toLowerCase();
    return availablePlayers.filter(
      (player) =>
        player.name?.toLowerCase().includes(query) ||
        player.email?.toLowerCase().includes(query) ||
        player.phone?.toLowerCase().includes(query),
    );
  }, [allPlayers, excludePlayerIds, searchQuery]);

  const selectedPlayer = allPlayers.find((p) => p.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/*biome-ignore lint/a11y/useSemanticElements: `<its fine>*/}
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between border-0 px-2 font-normal hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <span className={cn(!value && 'text-muted-foreground')}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search players..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm">Loading...</div>
            ) : (
              <>
                {filteredPlayers.length > 0 ? (
                  <CommandGroup heading="Organization Players">
                    {filteredPlayers.map((player) => (
                      <CommandItem
                        key={player.id}
                        value={player.id}
                        onSelect={() => {
                          onSelect(player);
                          setOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedPlayer?.id === player.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{player.name || 'Unnamed'}</span>
                          {(player.email || player.phone) && (
                            <span className="text-muted-foreground text-xs">
                              {player.email || player.phone}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  <CommandEmpty>
                    {searchQuery
                      ? 'No players found'
                      : 'No players in organization'}
                  </CommandEmpty>
                )}
                {filteredPlayers.length > 0 && <CommandSeparator />}
                {searchQuery && (
                  <>
                    <Separator orientation="horizontal" />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          onRename(searchQuery);
                          setOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Rename to "{searchQuery}"
                      </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onCreateNew(searchQuery || '');
                      setOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create {searchQuery ? `"${searchQuery}"` : 'new player'}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
