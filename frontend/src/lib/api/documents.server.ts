import 'server-only';

import { serverApiFetch } from '@/lib/api/server';
import type { ActivityDocument } from '@/lib/api/activities';

export type DocumentRow = ActivityDocument & {
  activity: { id: number; activity_code: string; name: string } | null;
  payment: { id: number; payment_number: string } | null;
};

export const listAllDocumentsServer = () => serverApiFetch<DocumentRow[]>('/api/v1/documents');
