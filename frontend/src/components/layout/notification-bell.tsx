'use client';

import { useEffect, useState, useTransition } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { listNotifications, markNotificationRead, type AppNotification } from '@/lib/api/notifications';

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    listNotifications()
      .then((data) => {
        if (!cancelled) {
          setNotifications(data);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  function handleOpenChange(next: boolean) {
    setOpen(next);

    if (next) {
      listNotifications()
        .then(setNotifications)
        .catch(() => {});
    }
  }

  function handleMarkRead(notification: AppNotification) {
    if (notification.read_at !== null) {
      return;
    }

    startTransition(async () => {
      try {
        const updated = await markNotificationRead(notification.id);
        setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      } catch {
        // Silently ignore — the item just stays marked unread.
      }
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="relative p-space-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
            title="Notifikasi"
          >
            <Icon name="notifications" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-lowest" />
            )}
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-80 bg-surface-container-lowest shadow-lg border border-outline-variant/40 p-0">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-body-sm text-body-sm px-space-md py-space-sm flex items-center justify-between">
            <span className="font-semibold text-on-surface">Notifikasi</span>
            {unreadCount > 0 && <span className="text-xs text-on-surface-variant">{unreadCount} belum dibaca</span>}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-outline-variant/30 m-0" />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-space-md py-space-lg text-center text-sm text-on-surface-variant">Tidak ada notifikasi.</div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                disabled={isPending}
                onClick={() => handleMarkRead(notification)}
                className={cn(
                  'w-full text-left px-space-md py-space-sm border-b border-outline-variant/20 last:border-b-0 hover:bg-surface-container transition-colors',
                  notification.read_at === null && 'bg-primary-container/20',
                )}
              >
                <div className="flex items-start gap-space-sm">
                  {notification.read_at === null && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  <div className={cn('flex-1 min-w-0', notification.read_at !== null && 'pl-3.5')}>
                    <p className="text-sm font-medium text-on-surface truncate">{notification.title}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-outline mt-1">{formatTimestamp(notification.created_at)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
