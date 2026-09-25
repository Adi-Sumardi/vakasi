import 'server-only';

import { serverApiFetch } from '@/lib/api/server';
import type { Activity } from '@/lib/api/activities';

export function getActivityServer(id: number): Promise<Activity> {
  return serverApiFetch<Activity>(`/api/v1/activities/${id}`);
}
