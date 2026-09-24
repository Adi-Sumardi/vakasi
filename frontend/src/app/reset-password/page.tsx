import Image from 'next/image';
import Link from 'next/link';

import { ResetPasswordForm } from '@/components/layout/reset-password-form';

/**
 * Landing page for the link emailed by
 * Illuminate\Auth\Notifications\ResetPassword (URL shape configured in
 * AppServiceProvider). The token and email arrive as query parameters;
 * reading them here rather than with useSearchParams keeps the form a
 * plain client component with no Suspense boundary to arrange.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token = '', email = '' } = await searchParams;

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

        <div className="flex flex-col gap-space-2xs">
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Buat password baru</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Masukkan password baru untuk akun <span className="font-semibold text-on-surface">{email || 'Anda'}</span>.
          </p>
        </div>

        {token && email ? (
          <ResetPasswordForm token={token} email={email} />
        ) : (
          <div className="flex flex-col gap-space-md">
            <p className="p-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium">
              Tautan reset tidak lengkap atau sudah tidak berlaku. Silakan minta tautan baru.
            </p>
            <Link
              href="/forgot-password"
              className="font-label-md text-label-md text-primary hover:underline font-semibold"
            >
              Minta tautan reset baru
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
