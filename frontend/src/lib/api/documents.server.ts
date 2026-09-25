import 'server-only';

import type { ActivityDocument } from '@/lib/api/activities';

export type DocumentRow = ActivityDocument & {
  activity: { id: number; activity_code: string; name: string } | null;
  payment: { id: number; payment_number: string } | null;
};
