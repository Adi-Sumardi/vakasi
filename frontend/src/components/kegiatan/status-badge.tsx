import { cn } from '@/lib/utils';

/** Status semantics per UI_UX.md section 9. */
const STATUS_MAP: Record<string, { label: string; className: string; dot: string }> = {
  draft: { label: 'Draft', className: 'bg-surface-container text-on-surface-variant', dot: 'bg-secondary' },
  submitted: { label: 'Menunggu Approval', className: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary' },
  rejected: { label: 'Ditolak', className: 'bg-error-container text-on-error-container', dot: 'bg-error' },
  approved: { label: 'Disetujui', className: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', dot: 'bg-tertiary' },
  verified: { label: 'Terverifikasi', className: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', dot: 'bg-tertiary' },
  processing: { label: 'Diproses', className: 'bg-primary-fixed text-on-primary-fixed-variant', dot: 'bg-primary' },
  paid: { label: 'Dibayar', className: 'bg-primary-fixed text-on-primary-fixed-variant', dot: 'bg-primary' },
  completed: { label: 'Selesai', className: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', dot: 'bg-tertiary' },
  pending: { label: 'Menunggu', className: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary' },
  cancelled: { label: 'Dibatalkan', className: 'bg-error-container text-on-error-container', dot: 'bg-error' },
  // Sianggar handoff states (FLOW.md section 8), shown alongside activity
  // status on the integration screen.
  sent: { label: 'Terkirim', className: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', dot: 'bg-tertiary' },
  failed: { label: 'Gagal Kirim', className: 'bg-error-container text-on-error-container', dot: 'bg-error' },
  skipped: { label: 'Belum Dikonfigurasi', className: 'bg-surface-container text-on-surface-variant', dot: 'bg-outline' },
  // Status Pencairan (Activity::disbursementState in the backend).
  belum_terkirim: { label: 'Belum Terkirim', className: 'bg-error-container text-on-error-container', dot: 'bg-error' },
  menunggu_sdm: { label: 'Menunggu SDM', className: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary' },
  diproses: { label: 'Diproses Sianggar', className: 'bg-primary-fixed text-on-primary-fixed-variant', dot: 'bg-primary' },
  dibayar: { label: 'Dibayar', className: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', dot: 'bg-tertiary' },
  ditolak: { label: 'Ditolak SDM', className: 'bg-error-container text-on-error-container', dot: 'bg-error' },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_MAP[status] ?? { label: status, className: 'bg-surface-container text-on-surface-variant', dot: 'bg-secondary' };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-semibold',
        meta.className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}
