'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { resetPassword } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/types';

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < 8;
  const mismatched = confirmation.length > 0 && password !== confirmation;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await resetPassword({ token, email, password, password_confirmation: confirmation });
      toast.success('Password berhasil direset. Silakan masuk dengan password baru.');
      router.push('/login');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Tidak dapat terhubung ke server. Coba lagi.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-md" noValidate>
      <div>
        <label
          htmlFor="new-password"
          className="font-label-md text-label-md text-on-surface font-semibold block mb-space-2xs"
        >
          Password Baru
        </label>
        <div className="relative">
          <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
          <input
            id="new-password"
            type={show ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            disabled={busy}
            className="w-full h-12 pl-10 pr-10 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
          />
          <button
            type="button"
            aria-label="Tampilkan atau sembunyikan password"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors focus:outline-none"
          >
            <Icon name={show ? 'visibility' : 'visibility_off'} className="text-[20px]" />
          </button>
        </div>
        {tooShort && (
          <p className="font-body-sm text-body-sm text-error mt-space-2xs">Password minimal 8 karakter.</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="font-label-md text-label-md text-on-surface font-semibold block mb-space-2xs"
        >
          Ulangi Password Baru
        </label>
        <div className="relative">
          <Icon name="lock_reset" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
          <input
            id="confirm-password"
            type={show ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="••••••••"
            disabled={busy}
            className="w-full h-12 pl-10 pr-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
          />
        </div>
        {mismatched && (
          <p className="font-body-sm text-body-sm text-error mt-space-2xs">Konfirmasi password tidak sama.</p>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
          <Icon name="error" className="text-error text-lg" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || tooShort || mismatched || password.length === 0}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-white font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50 cursor-pointer"
      >
        {busy ? 'Menyimpan...' : 'Simpan Password Baru'}
      </button>

      <Link
        href="/login"
        className="font-label-md text-label-md text-primary hover:underline font-semibold text-center"
      >
        Kembali ke halaman masuk
      </Link>
    </form>
  );
}
