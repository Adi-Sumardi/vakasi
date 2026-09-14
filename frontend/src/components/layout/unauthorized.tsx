import { Icon } from '@/components/ui/icon';

/**
 * Rendered in place of a page's real content when the signed-in user
 * lacks the permission that page requires — a clean stop instead of
 * an unhandled 403 ApiError crashing the Server Component (there is
 * no app-wide error.tsx boundary to catch that).
 */
export function Unauthorized() {
  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen items-center justify-center gap-space-md text-center">
      <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
        <Icon name="lock" className="text-2xl" />
      </div>
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Anda tidak memiliki akses</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
          Halaman ini memerlukan izin yang tidak dimiliki akun Anda saat ini.
        </p>
      </div>
    </div>
  );
}
