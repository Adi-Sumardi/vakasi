import 'server-only';

import { serverApiFetch } from '@/lib/api/server';

export type AuditLog = {
  id: number;
  user: string | null;
  entity_type: string;
  entity_id: number;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

export type AuditLogMeta = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

export const listAuditLogsServer = (page = 1) =>
  serverApiFetch<{ items: AuditLog[]; meta: AuditLogMeta }>(`/api/v1/audit-logs?page=${page}`);
