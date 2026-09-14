import { apiFetch } from '@/lib/api/client';

/** Mirrors App\Http\Resources\NotificationResource in the backend. */
export type AppNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export function listNotifications(): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>('/api/v1/notifications');
}

export function markNotificationRead(id: number): Promise<AppNotification> {
  return apiFetch<AppNotification>(`/api/v1/notifications/${id}/read`, { method: 'POST' });
}
