import 'server-only';

import type { HonorDetail, Activity } from '@/lib/api/activities';

/** GET /reports/honors returns HonorDetail with `activity` also loaded. */
export type HonorReportRow = HonorDetail & { activity: Pick<Activity, 'id' | 'activity_code' | 'name'> };

