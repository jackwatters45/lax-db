import { Link, useRouteContext } from '@tanstack/react-router';
import { LogIn, LogOut, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';
import { Button } from '../ui/button';

export function NavUser() {
  const { user } = useRouteContext({ from: '/_dashboard' });

  if (!user)
    return (
      <div className="flex items-center gap-2">
        <Button size={'sm'} variant="outline" asChild>
          <Link to="/register">
            <UserPlus />
            Sign up
          </Link>
        </Button>
        <Button size={'sm'} asChild>
          <Link to="/login">
            <LogIn />
            Log in
          </Link>
        </Button>
      </div>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage
            src={user.image ?? undefined}
            alt={user.name ?? 'user profile'}
          />
          <AvatarFallback className="rounded-lg uppercase">
            {user.name?.slice(0, 2) ?? user.email?.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? 'user profile'}
              />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = '/login';
                },
              },
            });
          }}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
