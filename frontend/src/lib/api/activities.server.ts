import 'server-only';

import { serverApiFetch } from '@/lib/api/server';
import type { Activity } from '@/lib/api/activities';

export function listActivitiesServer(params?: { status?: string }): Promise<Activity[]> {
  const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
  return serverApiFetch<Activity[]>(`/api/v1/activities${qs}`);
}

export function getActivityServer(id: number): Promise<Activity> {
  return serverApiFetch<Activity>(`/api/v1/activities/${id}`);
}
