'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { pushActivityToSianggar, SIANGGAR_STATUS_LABEL, type Activity } from '@/lib/api/activities';
import { useConfirm } from '@/components/common/confirm-dialog';

const EVENT_LABEL: Record<string, string> = {
  'intake.revision_requested': 'SDM meminta revisi',
  'intake.rejected': 'Ditolak SDM',
  'pengajuan.created': 'Pengajuan pencairan dibuat',
  'pengajuan.stage_changed': 'Pindah tahap approval',
  'pengajuan.paid': 'Honor dibayar',
  'pengajuan.rejected': 'Pengajuan ditolak',
};

const TONE: Record<string, { box: string; icon: string; iconName: string }> = {
  sent: { box: 'bg-tertiary-fixed border-tertiary/30', icon: 'text-tertiary', iconName: 'cloud_done' },
  pending: { box: 'bg-secondary-container/60 border-outline-variant/40', icon: 'text-secondary', iconName: 'cloud_sync' },
  failed: { box: 'bg-error-container border-error/30', icon: 'text-error', iconName: 'cloud_off' },
  skipped: { box: 'bg-surface-container-low border-outline-variant/40', icon: 'text-outline', iconName: 'cloud_off' },
};

/**
 * Approval is the end of VAKASI's own workflow; what happens next is the
 * push to Sianggar, where SDM picks the data up for Sianggar. A push that
 * silently failed would look identical to a successful one from the TU's
 * side, so the outcome is shown here rather than only in the log.
 */
export function SianggarHandoffCard({
  activity,
  canRetry,
}: {
  activity: Activity;
  canRetry: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const status = activity.sianggar_status;

  if (!status) {
    return null;
  }

  const tone = TONE[status] ?? TONE.pending;

  async function handleRetry() {
    const ok = await confirm({
      title: 'Kirim ulang ke Sianggar?',
      description: 'Data kegiatan, rincian honor, dan lampirannya dikirim lagi ke menu Vakasi di Sianggar.',
      confirmLabel: 'Kirim ulang',
      tone: 'primary',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await pushActivityToSianggar(activity.id);
      toast.success('Pengiriman ulang ke Sianggar sedang diproses.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal mengirim ulang ke Sianggar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-xl p-space-lg border shadow-xs flex flex-col gap-space-sm ${tone.box}`}>
      <div className="flex items-center gap-space-sm">
        <Icon name={tone.iconName} className={`text-[20px] ${tone.icon}`} />
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Pengiriman ke Sianggar</h3>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Setelah disetujui, data kegiatan dikirim ke menu <span className="font-semibold">Vakasi</span> di Sianggar
        untuk diunduh SDM dan diajukan pencairannya melalui Sianggar.
      </p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-space-md gap-y-space-2xs font-body-sm text-body-sm">
        <dt className="text-on-surface-variant">Status</dt>
        <dd className="text-on-surface font-semibold">{SIANGGAR_STATUS_LABEL[status] ?? status}</dd>
        {activity.disbursement_state && (
          <>
            <dt className="text-on-surface-variant">Pencairan</dt>
            <dd>
              <StatusBadge status={activity.disbursement_state} />
            </dd>
          </>
        )}
        {activity.disbursement?.nomor_pengajuan && (
          <>
            <dt className="text-on-surface-variant">No. Pengajuan</dt>
            <dd className="text-on-surface font-medium">{activity.disbursement.nomor_pengajuan}</dd>
          </>
        )}
        {activity.disbursement?.no_voucher && (
          <>
            <dt className="text-on-surface-variant">Voucher</dt>
            <dd className="text-on-surface font-medium">{activity.disbursement.no_voucher}</dd>
          </>
        )}
        {activity.sianggar_synced_at && (
          <>
            <dt className="text-on-surface-variant">Terkirim</dt>
            <dd className="text-on-surface font-medium">
              {new Date(activity.sianggar_synced_at).toLocaleString('id-ID')}
            </dd>
          </>
        )}
      </dl>

      {(activity.disbursement?.events?.length ?? 0) > 0 && (
        <ol className="flex flex-col gap-space-xs border-l-2 border-outline-variant/60 pl-space-md mt-space-2xs">
          {activity.disbursement!.events!.map((event, index) => (
            <li key={`${event.occurred_at}-${index}`} className="font-body-sm text-body-sm">
              <div className="text-on-surface font-medium">{EVENT_LABEL[event.event_type] ?? event.event_type}</div>
              <div className="text-on-surface-variant text-xs">
                {new Date(event.occurred_at).toLocaleString('id-ID')}
                {event.actor_name ? ` · ${event.actor_name}` : ''}
              </div>
              {event.note && <div className="text-on-surface-variant">{event.note}</div>}
            </li>
          ))}
        </ol>
      )}

      {activity.sianggar_last_error && (
        <p className="font-body-sm text-body-sm text-on-error-container break-words">
          {activity.sianggar_last_error}
        </p>
      )}

      {canRetry && status !== 'sent' && (
        <button
          type="button"
          disabled={busy}
          onClick={handleRetry}
          className="flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold disabled:opacity-50"
        >
          <Icon name="refresh" className="text-base text-white" />
          <span>{busy ? 'Mengirim...' : 'Kirim Ulang ke Sianggar'}</span>
        </button>
      )}
    </div>
  );
}
