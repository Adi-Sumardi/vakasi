'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { completePayment, uploadPaymentEvidence, type Payment } from '@/lib/api/payments';

export function PaymentActions({ payment }: { payment: Payment }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // Derived from the server, not local-only state — otherwise a page
  // refresh forgets that evidence was already uploaded and the button
  // reverts to "Unggah Bukti" even though the document exists.
  const hasEvidence = (payment.documents ?? []).some((d) => d.document_type === 'bukti_transfer');

  if (payment.status !== 'processing') {
    return null;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await uploadPaymentEvidence(payment.id, 'bukti_transfer', file);
      toast.success('Bukti transfer berhasil diunggah.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal mengunggah bukti.');
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    try {
      await completePayment(payment.id);
      toast.success('Pembayaran selesai diproses.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyelesaikan pembayaran. Pastikan bukti transfer sudah diunggah.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-space-xs">
      <input ref={fileInput} type="file" accept="application/pdf,image/jpeg,image/png" onChange={handleUpload} className="hidden" />
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
        onClick={handleComplete}
        className="flex items-center gap-1 px-3 py-1.5 rounded bg-primary hover:bg-primary-container text-white font-label-sm text-label-sm font-semibold disabled:opacity-50"
      >
        <Icon name="check_circle" className="text-sm text-white" />
        <span>Selesaikan</span>
      </button>
    </div>
  );
}
