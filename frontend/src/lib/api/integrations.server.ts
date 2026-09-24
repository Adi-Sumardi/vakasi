import { serverApiFetch } from '@/lib/api/server';
import type { Activity } from '@/lib/api/activities';

/**
 * Approved activities whose handoff to Sianggar still needs attention —
 * never sent, failed, or skipped because the integration was not
 * configured yet (FLOW.md section 8).
 */
export const listPendingSianggarHandoffs = () =>
  serverApiFetch<Activity[]>('/api/v1/integrations/sianggar/pending');
