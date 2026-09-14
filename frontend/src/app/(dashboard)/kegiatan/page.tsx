import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { listActivitiesServer } from '@/lib/api/activities.server';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { formatRupiah } from '@/lib/format';

export default async function SemuaKegiatanPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activities = await listActivitiesServer(status ? { status } : undefined);
  const pendingCount = activities.filter((a) => a.status === 'submitted').length;

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
            Semua Kegiatan &amp; Kepanitiaan
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Register seluruh pengajuan kegiatan sekolah dan status honorarium.
          </p>
        </div>
        <Link
          href="/kegiatan/buat"
          className="flex items-center gap-space-xs px-space-lg py-space-sm bg-primary hover:bg-primary-container text-white rounded-lg font-label-lg text-label-lg shadow-xs transition-all font-semibold self-start sm:self-auto"
        >
          <Icon name="add" className="text-base text-white" />
          <span>Buat Kegiatan Baru</span>
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="p-space-base bg-surface-container-low flex items-center gap-space-xs border-b border-outline-variant/30">
          <Link
            href="/kegiatan"
            className="px-space-md py-space-xs rounded-lg font-label-md text-label-md font-semibold bg-primary text-white shadow-xs"
          >
            Semua ({activities.length})
          </Link>
          <Link
            href="/kegiatan/approval"
            className="px-space-md py-space-xs rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-all flex items-center gap-1.5"
          >
            <span>Menunggu Approval</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-error-container text-on-error-container font-mono text-[11px] font-bold">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>

        {activities.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">
            Belum ada kegiatan. Klik &quot;Buat Kegiatan Baru&quot; untuk memulai pengajuan pertama.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">No. Kegiatan &amp; Judul</th>
                  <th className="px-space-base py-space-sm font-bold">Unit Kerja</th>
                  <th className="px-space-base py-space-sm font-bold">Jadwal</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Anggaran</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Status</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-space-base py-space-sm">
                      <div className="font-label-lg text-label-lg font-semibold text-primary">{act.activity_code}</div>
                      <div className="font-body-sm text-body-sm text-on-surface font-medium">{act.name}</div>
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">{act.unit?.name}</td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">
                      {act.start_date}
                      {act.end_date !== act.start_date ? ` - ${act.end_date}` : ''}
                    </td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell tabular-nums">
                      {formatRupiah(act.budget_amount)}
                    </td>
                    <td className="px-space-base py-space-sm text-center">
                      <StatusBadge status={act.status} />
                    </td>
                    <td className="px-space-base py-space-sm text-center">
                      <Link
                        href={`/kegiatan/${act.id}`}
                        className="px-3 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold transition-all border border-outline-variant/30 inline-flex items-center gap-1"
                      >
                        <Icon name="visibility" className="text-sm" />
                        <span>Detail</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
