/** Mirrors App\Services\DashboardService::summary(). */
export type DashboardActivityRow = {
  id: number;
  activity_code: string;
  name: string;
  status: string;
  unit: string | null;
  start_date: string | null;
  budget_amount: number;
};

export type DisbursementState = 'belum_terkirim' | 'menunggu_sdm' | 'diproses' | 'dibayar' | 'ditolak';

export const DISBURSEMENT_STATES: { key: DisbursementState; label: string }[] = [
  { key: 'belum_terkirim', label: 'Belum terkirim' },
  { key: 'menunggu_sdm', label: 'Menunggu SDM' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'dibayar', label: 'Dibayar' },
  { key: 'ditolak', label: 'Ditolak SDM' },
];

export type DashboardSummary = {
  scope: { unit: string | null };
  status_counts: { draft: number; submitted: number; rejected: number; approved: number };
  activities_this_month: number;
  honor_approved_this_year: number;
  honor_paid_this_year: number;
  disbursement_counts: Record<DisbursementState, number>;
  recent: DashboardActivityRow[];
  awaiting_approval?: DashboardActivityRow[];
  todo?: {
    missing_sk_panitia: DashboardActivityRow[];
    missing_honor: DashboardActivityRow[];
    rejected: DashboardActivityRow[];
  };
  per_unit?: {
    unit: string;
    activities: number;
    submitted: number;
    approved: number;
    honor_approved: number;
    budget_total: number;
  }[];
  sianggar_failed?: number;
  data_health?: {
    employees_total: number;
    employees_without_bank: number;
    rates_without_decree: number;
    rates_without_decree_file: number;
    units_without_kepala_sekolah: number;
  };
};
