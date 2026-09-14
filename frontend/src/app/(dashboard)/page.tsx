import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { listActivitiesServer } from '@/lib/api/activities.server';
import { meServer } from '@/lib/api/auth.server';
import { hasPermission } from '@/lib/api/auth';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Activity } from '@/lib/api/activities';

function countByStatus(activities: Activity[], status: string) {
  return activities.filter((a) => a.status === status).length;
}

export default async function DashboardPage() {
  const [activities, user] = await Promise.all([listActivitiesServer(), meServer()]);

  const totalNetHonor = activities.reduce(
    (sum, a) => sum + (a.honor_details?.reduce((s, d) => s + d.net_amount, 0) ?? 0),
    0
  );

  const canApprove = hasPermission(user, 'activities.approve');
  const needsAction = canApprove
    ? activities.filter((a) => a.status === 'submitted')
    : activities.filter((a) => a.creator?.id === user.id && ['draft', 'rejected'].includes(a.status));

  const recent = [...activities]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full gap-space-xl">
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg bg-surface-container-lowest p-space-xl rounded-xl shadow-sm">
        <div className="flex flex-col gap-space-2xs">
          <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider w-fit">
            Dashboard {user.role?.name ?? ''}
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Selamat datang, {user.name}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Kelola kegiatan, honor, dan pembayaran sekolah dari satu tempat.
          </p>
        </div>
        {hasPermission(user, 'activities.create') && (
          <Link
            href="/kegiatan/buat"
            className="flex items-center gap-space-xs px-space-lg py-space-sm bg-primary hover:bg-primary-container text-white rounded-lg font-label-lg text-label-lg shadow-sm transition-all font-semibold self-start"
          >
            <Icon name="add" className="text-base text-white" />
            <span>Buat Kegiatan Baru</span>
          </Link>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        {[
          { label: 'Draft', value: countByStatus(activities, 'draft'), icon: 'edit_note', badge: 'bg-secondary-container text-on-secondary-container' },
          { label: 'Menunggu Approval', value: countByStatus(activities, 'submitted'), icon: 'hourglass_top', badge: 'bg-error-container text-on-error-container' },
          { label: 'Disetujui', value: countByStatus(activities, 'approved'), icon: 'check_circle', badge: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
          { label: 'Selesai', value: countByStatus(activities, 'completed'), icon: 'task_alt', badge: 'bg-primary-fixed text-primary' },
        ].map((card) => (
          <div key={card.label} className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{card.label}</span>
              <span className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', card.badge)}>
                <Icon name={card.icon} className="text-[20px]" fill />
              </span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface font-bold mt-space-sm">{card.value}</div>
          </div>
        ))}
        <div className="bg-primary p-space-lg rounded-xl shadow-sm flex flex-col justify-between text-white">
          <span className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">Total Honor Netto</span>
          <div className="font-currency-display text-headline-sm font-bold mt-space-sm">{formatRupiah(totalNetHonor)}</div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-space-lg border-b border-outline-variant/30">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            {canApprove ? 'Menunggu Persetujuan Anda' : 'Kegiatan Membutuhkan Tindakan'}
          </h2>
        </div>
        {needsAction.length === 0 ? (
          <p className="p-space-lg font-body-sm text-body-sm text-on-surface-variant">Tidak ada yang perlu ditindaklanjuti saat ini.</p>
        ) : (
          <div className="divide-y divide-surface-container-low">
            {needsAction.map((a) => (
              <Link key={a.id} href={`/kegiatan/${a.id}`} className="flex items-center justify-between p-space-lg hover:bg-surface-container-low/50 transition-colors">
                <div>
                  <div className="font-label-md text-label-md font-semibold text-primary">{a.activity_code}</div>
                  <div className="font-body-sm text-body-sm text-on-surface">{a.name}</div>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="p-space-lg border-b border-outline-variant/30 flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Kegiatan Terbaru</h2>
          <Link href="/kegiatan" className="text-primary font-label-sm text-label-sm font-semibold hover:underline">Lihat semua</Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-space-lg font-body-sm text-body-sm text-on-surface-variant">Belum ada kegiatan.</p>
        ) : (
          <div className="divide-y divide-surface-container-low">
            {recent.map((a) => (
              <Link key={a.id} href={`/kegiatan/${a.id}`} className="flex items-center justify-between p-space-lg hover:bg-surface-container-low/50 transition-colors">
                <div>
                  <div className="font-label-md text-label-md font-semibold text-on-surface">{a.activity_code} &bull; {a.name}</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">{a.unit?.name}</div>
                </div>
                <div className="flex items-center gap-space-md">
                  <span className="font-currency-cell text-currency-cell text-on-surface">{formatRupiah(a.budget_amount)}</span>
                  <StatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
