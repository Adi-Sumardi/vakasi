'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { forgotPassword } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/types';

/**
 * PRD.md FR-01. The confirmation is intentionally the same whether or
 * not the address is registered, matching the API — a different message
 * would let anyone test which emails have accounts.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Tidak dapat terhubung ke server. Coba lagi.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-space-base sm:p-space-xl antialiased">
      <main className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-[0_20px_25px_-5px_rgba(15,23,42,0.1)] border border-outline-variant/30 p-space-xl sm:p-space-2xl flex flex-col gap-space-lg">
        <div className="flex items-center gap-space-sm">
          <Image
            alt="Logo VAKASI"
            src="/logo.png"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-xl object-contain bg-surface-container-low p-1"
          />
          <span className="font-headline-sm text-headline-sm text-primary font-bold leading-tight">VAKASI</span>
        </div>

        {sent ? (
          <div className="flex flex-col gap-space-md">
            <div className="p-3 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed-variant text-sm font-medium flex items-start gap-2">
              <Icon name="mark_email_read" className="text-lg" />
              <span>
                Jika email tersebut terdaftar dan akunnya aktif, kami telah mengirim tautan reset password.
                Tautan berlaku 60 menit.
              </span>
            </div>
            <Link href="/login" className="font-label-md text-label-md text-primary hover:underline font-semibold">
              Kembali ke halaman masuk
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-space-2xs">
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Lupa password</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru.
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-space-md" noValidate>
              <div>
                <label
                  htmlFor="email-input"
                  className="font-label-md text-label-md text-on-surface font-semibold block mb-space-2xs"
                >
                  Email
                </label>
                <div className="relative">
                  <Icon name="person" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
                  <input
                    id="email-input"
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sekolah.sch.id"
                    disabled={busy}
                    className="w-full h-12 pl-10 pr-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
                  <Icon name="error" className="text-error text-lg" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-white font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Mengirim...' : 'Kirim Tautan Reset'}
              </button>

              <Link
                href="/login"
                className="font-label-md text-label-md text-primary hover:underline font-semibold text-center"
              >
                Kembali ke halaman masuk
              </Link>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
