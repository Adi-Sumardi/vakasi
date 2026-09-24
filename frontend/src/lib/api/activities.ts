import { apiFetch } from '@/lib/api/client';
import type { Employee } from '@/lib/api/employees';
import type { ActivityType, FundSource, HonorType, Unit } from '@/lib/api/master-data';

export type Budget = {
  id: number;
  budget_code: string;
  budget_amount: number;
  committed_amount: number;
  approved_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
};

export type ActivityMember = {
  id: number;
  employee: Employee;
  role_name: string;
  notes: string | null;
};

export type HonorDetail = {
  id: number;
  employee: Employee;
  honor_type: HonorType;
  rate_snapshot: number;
  volume: number;
  unit_snapshot: string;
  gross_amount: number;
  tax_amount: number;
  deduction_amount: number;
  net_amount: number;
  notes: string | null;
};

export type ApprovalLog = {
  action: string;
  from_status: string;
  to_status: string;
  notes: string | null;
  acted_by: string | null;
  acted_at: string;
};

export type Approval = {
  id: number;
  approval_type: string;
  sequence: number;
  status: string;
  approver: { id: number; name: string } | null;
  decision_at: string | null;
  notes: string | null;
  logs?: ApprovalLog[];
};

export type ActivityDocument = {
  id: number;
  document_type: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
};

export const ACTIVITY_STATUSES = [
  'draft',
  'submitted',
  'rejected',
  'approved',
  'verified',
  'processing',
  'paid',
  'completed',
] as const;

export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

/**
 * VAKASI's workflow ends at `approved`; everything after it happens in
 * Sianggar and Sianggar. This tracks whether the handoff got through.
 */
export type SianggarStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export const SIANGGAR_STATUS_LABEL: Record<SianggarStatus, string> = {
  pending: 'Menunggu dikirim',
  sent: 'Terkirim ke Sianggar',
  failed: 'Gagal dikirim',
  skipped: 'Integrasi belum dikonfigurasi',
};

export type Activity = {
  id: number;
  activity_code: string;
  name: string;
  description: string | null;
  activity_type: ActivityType;
  unit: Unit;
  fund_source: FundSource;
  pic: Employee | null;
  start_date: string;
  end_date: string;
  location: string | null;
  budget_amount: number;
  status: ActivityStatus;
  submitted_at: string | null;
  approved_at: string | null;
  completed_at: string | null;
  verification_code: string | null;
  approval_document_number: string | null;
  /** Handoff to Sianggar after approval — see FLOW.md section 8. */
  sianggar_status: SianggarStatus | null;
  sianggar_synced_at: string | null;
  sianggar_last_error: string | null;
  creator?: { id: number; name: string };
  budget?: Budget;
  members?: ActivityMember[];
  honor_details?: HonorDetail[];
  approvals?: Approval[];
  documents?: ActivityDocument[];
  created_at: string;
};

export type CreateActivityInput = {
  activity_type_id: number;
  unit_id: number;
  fund_source_id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  budget_amount: number;
  pic_employee_id?: number | null;
};

export type UpdateActivityInput = Partial<CreateActivityInput>;

export function listActivities(params?: { status?: string }): Promise<Activity[]> {
  const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
  return apiFetch<Activity[]>(`/api/v1/activities${qs}`);
}

export function getActivity(id: number): Promise<Activity> {
  return apiFetch<Activity>(`/api/v1/activities/${id}`);
}

export function createActivity(input: CreateActivityInput): Promise<Activity> {
  return apiFetch<Activity>('/api/v1/activities', { method: 'POST', body: input });
}

export function updateActivity(id: number, input: UpdateActivityInput): Promise<Activity> {
  return apiFetch<Activity>(`/api/v1/activities/${id}`, { method: 'PUT', body: input });
}

export function cancelActivity(id: number): Promise<null> {
  return apiFetch<null>(`/api/v1/activities/${id}/cancel`, { method: 'POST' });
}

export function removeActivityMember(activityId: number, memberId: number): Promise<null> {
  return apiFetch<null>(`/api/v1/activities/${activityId}/members/${memberId}`, { method: 'DELETE' });
}

export function addActivityMember(
  activityId: number,
  input: { employee_id: number; role_name: string; notes?: string }
): Promise<ActivityMember> {
  return apiFetch<ActivityMember>(`/api/v1/activities/${activityId}/members`, {
    method: 'POST',
    body: input,
  });
}

export type CalculateHonorItem = {
  employee_id: number;
  honor_type_id: number;
  volume: number;
  tax_amount?: number;
  deduction_amount?: number;
};

/** Re-sends an approved activity to Sianggar after a failed handoff. */
export function pushActivityToSianggar(activityId: number): Promise<Activity> {
  return apiFetch<Activity>(`/api/v1/integrations/sianggar/activities/${activityId}/push`, {
    method: 'POST',
  });
}

export function calculateHonor(
  activityId: number,
  items: CalculateHonorItem[]
): Promise<{ items: HonorDetail[]; gross_amount: number; tax_amount: number; deduction_amount: number; net_amount: number }> {
  return apiFetch(`/api/v1/activities/${activityId}/calculate-honor`, {
    method: 'POST',
    body: { items },
  });
}

export function submitActivity(activityId: number): Promise<Activity> {
  return apiFetch<Activity>(`/api/v1/activities/${activityId}/submit`, { method: 'POST' });
}

export function approveActivity(activityId: number, notes?: string): Promise<Activity> {
  return apiFetch<Activity>(`/api/v1/activities/${activityId}/approve`, {
    method: 'POST',
    body: { notes },
  });
}

export function rejectActivity(activityId: number, notes: string): Promise<Activity> {
  return apiFetch<Activity>(`/api/v1/activities/${activityId}/reject`, {
    method: 'POST',
    body: { notes },
  });
}
