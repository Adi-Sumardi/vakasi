'use client';

import { useEffect } from 'react';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isForbidden = error instanceof ApiError && error.status === 403;

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen items-center justify-center gap-space-md text-center">
      <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
        <Icon name="error" className="text-2xl" />
      </div>
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
          {isForbidden ? 'Anda tidak memiliki akses' : 'Terjadi kesalahan'}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
          {isForbidden
            ? 'Halaman ini memerlukan izin yang tidak dimiliki akun Anda saat ini.'
            : 'Coba muat ulang halaman ini. Jika masalah berlanjut, hubungi administrator.'}
        </p>
      </div>
      {!isForbidden && (
        <button
          type="button"
          onClick={reset}
          className="px-space-lg py-space-sm rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}
