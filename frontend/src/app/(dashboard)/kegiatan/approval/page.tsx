import Link from 'next/link';

import { HeroStat, PageHeader } from '@/components/common/page-header';
import { PaginationBar } from '@/components/common/pagination-bar';
import { Icon } from '@/components/ui/icon';
import type { Activity } from '@/lib/api/activities';
import { meServer } from '@/lib/api/auth.server';
import { serverApiFetchPage, toQuery } from '@/lib/api/server';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

type QueueItem = Activity & { members_count?: number; honor_total?: number; has_sk_panitia?: boolean };

function daysWaiting(submittedAt: string | null): number {
  if (!submittedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(submittedAt).getTime()) / 86_400_000));
}

/**
 * Kepala Sekolah's queue, oldest first. Each card carries what decides
 * whether it can be approved quickly (SK Panitia, honor vs anggaran,
 * size of the committee) so the approver opens the right one first.
 */
export default async function ApprovalKegiatanPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const me = await meServer();
  const list = await serverApiFetchPage<QueueItem>(`/api/v1/approvals${toQuery({ page })}`);
  const activities = list.data;
  const pageHonor = activities.reduce((sum, a) => sum + (a.honor_total ?? 0), 0);
  const oldest = activities.reduce((max, a) => Math.max(max, daysWaiting(a.submitted_at)), 0);

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: 'Kegiatan', href: '/kegiatan' }, { label: 'Menunggu Approval' }]}
        eyebrow={me.scoped_unit_id ? me.unit?.name : 'Semua unit'}
        title="Menunggu Persetujuan"
        description="Kegiatan yang sudah diajukan TU. Periksa SK Panitia dan rincian honor, lalu setujui atau kembalikan dengan alasan."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
          <HeroStat label="Menunggu" value={`${list.meta.total} kegiatan`} />
          <HeroStat label="Total honor (halaman ini)" value={formatRupiah(pageHonor)} />
          <HeroStat label="Paling lama menunggu" value={list.meta.total > 0 ? `${oldest} hari` : '-'} />
        </div>
      </PageHeader>

      {activities.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-space-2xl flex flex-col items-center gap-space-sm text-center">
          <span className="w-14 h-14 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center">
            <Icon name="task_alt" className="text-2xl" />
          </span>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Tidak ada yang menunggu</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Semua pengajuan sudah Anda putuskan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-space-md">
          {activities.map((act) => {
            const waiting = daysWaiting(act.submitted_at);
            const honor = act.honor_total ?? 0;
            const overBudget = honor > act.budget_amount;

            return (
              <Link
                key={act.id}
                href={`/kegiatan/${act.id}`}
                className="lift bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs p-space-lg flex flex-col gap-space-md"
              >
                <div className="flex items-start justify-between gap-space-md">
                  <div className="min-w-0">
                    <div className="font-label-md text-label-md font-semibold text-primary">{act.activity_code}</div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{act.name}</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {act.unit?.name} · {act.activity_type?.name} · oleh {act.creator?.name ?? '-'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-bold whitespace-nowrap',
                      waiting >= 3 ? 'bg-error-container text-on-error-container' : 'bg-gold-soft text-on-gold'
                    )}
                  >
                    {waiting === 0 ? 'Hari ini' : `${waiting} hari`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-space-sm">
                  <Figure label="Total honor" value={formatRupiah(honor)} tone={overBudget ? 'bad' : 'normal'} />
                  <Figure label="Anggaran" value={formatRupiah(act.budget_amount)} />
                  <Figure label="Panitia" value={`${act.members_count ?? 0} orang`} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex flex-wrap gap-space-xs">
                    <Chip ok={!!act.has_sk_panitia} label={act.has_sk_panitia ? 'SK Panitia terlampir' : 'SK Panitia belum ada'} />
                    <Chip ok={!overBudget} label={overBudget ? 'Melebihi anggaran' : 'Dalam anggaran'} />
                  </div>
                  <span className="inline-flex items-center gap-1 font-label-md text-label-md font-bold text-primary">
                    Tinjau
                    <Icon name="arrow_forward" className="text-sm" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {list.meta.last_page > 1 && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
          <PaginationBar meta={list.meta} basePath="/kegiatan/approval" />
        </div>
      )}
    </div>
  );
}

function Figure({ label, value, tone = 'normal' }: { label: string; value: string; tone?: 'normal' | 'bad' }) {
  return (
    <div className="rounded-xl bg-surface-container-low px-space-sm py-space-xs min-w-0">
      <div className="font-label-sm text-label-sm text-on-surface-variant">{label}</div>
      <div className={cn('font-label-lg text-label-lg font-bold tabular-nums truncate', tone === 'bad' ? 'text-error' : 'text-on-surface')}>{value}</div>
    </div>
  );
}

function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-semibold',
        ok ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-error-container text-on-error-container'
      )}
    >
      <Icon name={ok ? 'check' : 'error'} className="text-xs" />
      {label}
    </span>
  );
}
