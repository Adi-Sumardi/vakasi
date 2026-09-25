'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useConfirm } from '@/components/common/confirm-dialog';
import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { approveActivity, cancelActivity, rejectActivity, submitActivity, type Activity } from '@/lib/api/activities';

type Props = {
  activity: Activity;
  isOwner: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canManage: boolean;
};

export function ActivityActions({ activity, isOwner, canSubmit, canApprove, canManage }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  async function run(fn: () => Promise<unknown>, successMsg: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    const ok = await confirm({
      title: `Batalkan kegiatan ${activity.activity_code}?`,
      description: 'Draft ini dihapus beserta anggaran dan peserta yang sudah ditambahkan. Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Ya, batalkan kegiatan',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await cancelActivity(activity.id);
      toast.success('Kegiatan berhasil dibatalkan.');
      router.push('/kegiatan');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal membatalkan kegiatan.');
    } finally {
      setBusy(false);
    }
  }

  const showSubmit = canSubmit && isOwner && ['draft', 'rejected'].includes(activity.status);
  const showApprove = canApprove && activity.status === 'submitted';
  const showCancel = canManage && isOwner && activity.status === 'draft';

  if (!showSubmit && !showApprove && !showCancel) {
    return null;
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col gap-space-md">
      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Aksi</h3>

      {showSubmit && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            const ok = await confirm({
              title: 'Ajukan ke Kepala Sekolah?',
              description: 'Setelah diajukan, kegiatan tidak bisa diubah sampai disetujui atau ditolak.',
              confirmLabel: 'Ya, ajukan',
              tone: 'primary',
            });
            if (ok) run(() => submitActivity(activity.id), 'Kegiatan berhasil diajukan.');
          }}
          className="flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold disabled:opacity-50"
        >
          <Icon name="send" className="text-base text-white" />
          <span>Submit untuk Approval</span>
        </button>
      )}

      {showApprove && !showReject && (
        <div className="flex flex-col gap-space-sm">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => approveActivity(activity.id), 'Kegiatan berhasil disetujui.')}
            className="flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-tertiary hover:bg-tertiary-container text-white font-label-md text-label-md font-semibold disabled:opacity-50"
          >
            <Icon name="check_circle" className="text-base text-white" />
            <span>Setujui Pengajuan</span>
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            className="flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-lowest hover:bg-error-container text-error font-label-md text-label-md font-semibold border border-error/40"
          >
            <Icon name="cancel" className="text-base" />
            <span>Tolak Pengajuan</span>
          </button>
        </div>
      )}

      {showApprove && showReject && (
        <div className="flex flex-col gap-space-sm">
          <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
            Alasan Penolakan (wajib)
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Jelaskan alasan penolakan..."
            className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
          />
          <div className="flex gap-space-sm">
            <button
              type="button"
              onClick={() => setShowReject(false)}
              className="flex-1 px-space-lg py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={busy || rejectReason.trim().length < 5}
              onClick={() =>
                run(() => rejectActivity(activity.id, rejectReason), 'Kegiatan berhasil ditolak.').then(() => {
                  setShowReject(false);
                  setRejectReason('');
                })
              }
              className="flex-1 px-space-lg py-space-sm rounded-lg bg-error hover:opacity-90 text-white font-label-md text-label-md font-semibold disabled:opacity-50"
            >
              Kirim Penolakan
            </button>
          </div>
        </div>
      )}

      {/* No "Buat Pembayaran" here: APPROVED is the end of VAKASI's
          workflow. The approved activity is pushed to Sianggar, SDM
          downloads it there, and the disbursement is raised in Sianggar
          (FLOW.md section 8). The handoff status is shown in its own
          card on this page. */}

      {showCancel && (
        <button
          type="button"
          disabled={busy}
          onClick={handleCancel}
          className="flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface-container-lowest hover:bg-error-container text-error font-label-md text-label-md font-semibold border border-error/40 disabled:opacity-50"
        >
          <Icon name="block" className="text-base" />
          <span>Batalkan Kegiatan</span>
        </button>
      )}
    </div>
  );
}
