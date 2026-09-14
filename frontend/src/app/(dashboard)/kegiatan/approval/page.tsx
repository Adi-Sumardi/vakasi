import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { listActivitiesServer } from '@/lib/api/activities.server';
import { formatRupiah } from '@/lib/format';

export default async function ApprovalKegiatanPage() {
  const activities = await listActivitiesServer({ status: 'submitted' });

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Menunggu Approval</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Kegiatan yang sudah disubmit TU dan menunggu keputusan Kepala Sekolah.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">
          Tidak ada pengajuan yang menunggu approval saat ini.
        </div>
      ) : (
        <div className="flex flex-col gap-space-md">
          {activities.map((act) => (
            <Link
              key={act.id}
              href={`/kegiatan/${act.id}`}
              className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-md"
            >
              <div>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-lg text-label-lg font-semibold text-primary">{act.activity_code}</span>
                  <StatusBadge status={act.status} />
                </div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-space-2xs">{act.name}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {act.unit?.name} &bull; diajukan oleh {act.creator?.name} &bull; {act.start_date}
                </p>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="text-right">
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Anggaran</div>
                  <div className="font-currency-cell text-currency-cell text-on-surface font-bold">{formatRupiah(act.budget_amount)}</div>
                </div>
                <Icon name="chevron_right" className="text-outline" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
