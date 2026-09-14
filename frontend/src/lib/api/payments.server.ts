import 'server-only';

import { serverApiFetch } from '@/lib/api/server';
import type { Payment } from '@/lib/api/payments';

export function listPaymentsServer(params?: { status?: string }): Promise<Payment[]> {
  const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
  return serverApiFetch<Payment[]>(`/api/v1/payments${qs}`);
}
