import { apiFetch } from '@/lib/api/client';
import type { Activity, ActivityDocument } from '@/lib/api/activities';
import type { Employee } from '@/lib/api/employees';

export type SearchResults = {
  activities: Pick<Activity, 'id' | 'activity_code' | 'name' | 'activity_type' | 'unit'>[];
  employees: Employee[];
  documents: (ActivityDocument & { activity: { id: number; activity_code: string; name: string } | null })[];
};

export function search(query: string): Promise<SearchResults> {
  return apiFetch<SearchResults>(`/api/v1/search?q=${encodeURIComponent(query)}`);
}
