/**
 * Shown the moment a menu is clicked, while the next page renders on the
 * server. Same frame as a real page (banner, then a table card), so the
 * content swaps in without the layout jumping.
 */
export default function DashboardLoading() {
  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg" aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat halaman...</span>

      <section className="hero-surface rounded-2xl px-space-lg py-space-lg sm:px-space-xl sm:py-space-xl shadow-sm flex flex-col gap-space-sm">
        <div className="h-3 w-40 rounded bg-white/20 animate-pulse" />
        <div className="h-7 w-72 max-w-full rounded bg-white/25 animate-pulse" />
        <div className="h-4 w-full max-w-xl rounded bg-white/15 animate-pulse" />
      </section>

      <div className="h-9 w-64 max-w-full rounded-lg bg-surface-container animate-pulse" />

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        <div className="h-10 bg-surface-container-low border-b border-outline-variant/30" />
        <div className="divide-y divide-surface-container-low">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-space-md px-space-base py-space-md">
              <div className="h-4 w-1/4 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-1/3 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-1/6 ml-auto rounded bg-surface-container animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
