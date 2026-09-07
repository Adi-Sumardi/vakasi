'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import type { AuthUser } from '@/lib/api/auth';
import { logout } from '@/lib/api/auth';

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserMenu({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="flex items-center gap-space-sm px-2 py-1 h-auto hover:bg-surface-container rounded-lg">
            <Avatar className="size-8 rounded-full ring-1 ring-outline-variant">
              <AvatarFallback className="bg-primary-container text-on-primary font-bold text-xs">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:flex flex-col leading-tight">
              <span className="font-label-md text-label-md text-on-surface font-semibold">{user.name}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">{user.role?.name ?? 'Staf Tata Usaha'}</span>
            </div>
            <Icon name="expand_more" className="text-outline text-base" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56 bg-surface-container-lowest shadow-lg border border-outline-variant/40">
        <DropdownMenuLabel className="font-body-sm text-body-sm">
          <div className="font-semibold text-on-surface">{user.name}</div>
          <div className="text-xs text-on-surface-variant">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-outline-variant/30" />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isPending}
          className="text-error cursor-pointer font-label-md text-label-md flex items-center gap-2"
        >
          <Icon name="logout" className="text-error text-base" />
          <span>{isPending ? 'Keluar...' : 'Keluar'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
