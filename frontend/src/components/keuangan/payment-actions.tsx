'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import {
  cancelPayment,
  completePayment,
  processPayment,
  uploadPaymentEvidence,
  type Payment,
} from '@/lib/api/payments';

/**
 * Mirrors the server-side payment lifecycle in PaymentService:
 *
 *   verified   -> "Proses Pembayaran" (disbursement starts)
 *   processing -> upload bukti transfer, then "Selesaikan"
 *
 * Both states can still be cancelled; once paid, nothing here applies.
 */
export function PaymentActions({ payment }: { payment: Payment }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  // Derived from the server, not local-only state — otherwise a page
  // refresh forgets that evidence was already uploaded and the button
  // reverts to "Unggah Bukti" even though the document exists.
  const hasEvidence = (payment.documents ?? []).some((d) => d.document_type === 'bukti_transfer');

  const isVerified = payment.status === 'verified';
  const isProcessing = payment.status === 'processing';

  if (!isVerified && !isProcessing) {
    return null;
  }

  async function run(action: () => Promise<unknown>, success: string, fallback: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await run(
      () => uploadPaymentEvidence(payment.id, 'bukti_transfer', file),
      'Bukti transfer berhasil diunggah.',
      'Gagal mengunggah bukti.'
    );
  }

  if (cancelling) {
    return (
      <div className="flex flex-col gap-space-xs items-stretch min-w-56">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Alasan pembatalan (wajib)..."
          className="w-full px-2 py-1.5 rounded bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
        />
        <div className="flex gap-space-xs">
          <button
            type="button"
            onClick={() => setCancelling(false)}
            className="flex-1 px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold"
          >
            Kembali
          </button>
          <button
            type="button"
            disabled={busy || reason.trim().length < 5}
            onClick={() =>
              run(
                () => cancelPayment(payment.id, reason),
                'Pembayaran dibatalkan, kegiatan kembali ke status Disetujui.',
                'Gagal membatalkan pembayaran.'
              ).then(() => {
                setCancelling(false);
                setReason('');
              })
            }
            className="flex-1 px-3 py-1.5 rounded bg-error hover:opacity-90 text-white font-label-sm text-label-sm font-semibold disabled:opacity-50"
          >
            Batalkan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-space-xs">
      {isVerified && (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(() => processPayment(payment.id), 'Pembayaran mulai diproses.', 'Gagal memproses pembayaran.')
          }
          className="flex items-center gap-1 px-3 py-1.5 rounded bg-primary hover:bg-primary-container text-white font-label-sm text-label-sm font-semibold disabled:opacity-50"
        >
          <Icon name="play_arrow" className="text-sm text-white" />
          <span>Proses Pembayaran</span>
        </button>
      )}

      {isProcessing && (
        <>
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold border border-outline-variant/30 disabled:opacity-50"
          >
            <Icon name="upload_file" className="text-sm" />
            <span>{hasEvidence ? 'Bukti Terunggah' : 'Unggah Bukti'}</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                () => completePayment(payment.id),
                'Pembayaran selesai diproses.',
                'Gagal menyelesaikan pembayaran. Pastikan bukti transfer sudah diunggah.'
              )
            }
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-primary hover:bg-primary-container text-white font-label-sm text-label-sm font-semibold disabled:opacity-50"
          >
            <Icon name="check_circle" className="text-sm text-white" />
            <span>Selesaikan</span>
          </button>
        </>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => setCancelling(true)}
        className="flex items-center gap-1 px-3 py-1.5 rounded bg-surface-container-lowest hover:bg-error-container text-error font-label-sm text-label-sm font-semibold border border-error/40 disabled:opacity-50"
      >
        <Icon name="block" className="text-sm" />
        <span>Batal</span>
      </button>
    </div>
  );
}
