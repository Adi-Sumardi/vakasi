'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { pushActivityToSianggar } from '@/lib/api/activities';

export function SianggarRetryButton({ activityId }: { activityId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await pushActivityToSianggar(activityId);
      toast.success('Pengiriman ulang sedang diproses.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal mengirim ulang ke Sianggar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary hover:bg-primary-container text-white font-label-sm text-label-sm font-semibold disabled:opacity-50"
    >
      <Icon name="refresh" className="text-sm text-white" />
      <span>{busy ? 'Mengirim...' : 'Kirim Ulang'}</span>
    </button>
  );
}
