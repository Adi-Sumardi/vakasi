import Link from 'next/link';
import { HeroButton, PageHeader } from '@/components/common/page-header';

import { PageTabs } from '@/components/common/page-tabs';
import { PaginationBar } from '@/components/common/pagination-bar';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import type { Activity } from '@/lib/api/activities';
import { hasPermission } from '@/lib/api/auth';
import { meServer } from '@/lib/api/auth.server';
import type { DashboardSummary } from '@/lib/api/dashboard';
import type { Unit } from '@/lib/api/master-data';
import { serverApiFetch, serverApiFetchPage, toQuery } from '@/lib/api/server';
import { formatRupiah } from '@/lib/format';

const STATUS_TABS = [
  { key: '', label: 'Semua' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Diajukan' },
  { key: 'rejected', label: 'Ditolak / Revisi' },
  { key: 'approved', label: 'Disetujui' },
] as const;

type Search = { status?: string; search?: string; unit_id?: string; page?: string };

export default async function KegiatanPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { status = '', search = '', unit_id = '', page = '1' } = await searchParams;
  const user = await meServer();
  const scoped = !!user?.scoped_unit_id;

  const [list, summary, units] = await Promise.all([
    serverApiFetchPage<Activity>(`/api/v1/activities${toQuery({ status, search, unit_id, page })}`),
    serverApiFetch<DashboardSummary>('/api/v1/dashboard'),
    scoped ? Promise.resolve([] as Unit[]) : serverApiFetch<Unit[]>('/api/v1/units?per_page=1000'),
  ]);

  const counts: Record<string, number> = {
    draft: summary.status_counts.draft,
    submitted: summary.status_counts.submitted,
    rejected: summary.status_counts.rejected,
    approved: summary.status_counts.approved,
  };
  counts[''] = Object.values(counts).reduce((a, b) => a + b, 0);

  const keep = { search: search || undefined, unit_id: unit_id || undefined };
  const tabHref = (key: string) => `/kegiatan${toQuery({ status: key, ...keep })}`;

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: scoped ? 'Kegiatan Unit' : 'Kegiatan' }]}
        eyebrow={scoped ? user?.unit?.name : 'Semua unit'}
        title={scoped ? 'Kegiatan Unit' : 'Kegiatan'}
        description={scoped ? `Kegiatan dan kepanitiaan ${user?.unit?.name ?? 'unit Anda'}.` : 'Seluruh kegiatan dan kepanitiaan di semua unit.'}
        actions={
          hasPermission(user, 'activities.create') ? (
            <HeroButton href="/kegiatan/buat" icon="add">
              Buat Kegiatan
            </HeroButton>
          ) : undefined
        }
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <PageTabs
          active={status}
          tabs={STATUS_TABS.map((t) => ({ key: t.key, label: t.label, href: tabHref(t.key), count: counts[t.key] }))}
        />
        <form className="flex flex-wrap items-center gap-space-xs" action="/kegiatan">
          {status && <input type="hidden" name="status" value={status} />}
          {!scoped && (
            <select
              name="unit_id"
              defaultValue={unit_id}
              aria-label="Filter unit"
              className="h-9 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-body-sm text-body-sm"
            >
              <option value="">Semua unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
          <input
            name="search"
            defaultValue={search}
            placeholder="Cari nama atau kode..."
            aria-label="Cari kegiatan"
            className="h-9 w-56 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-body-sm text-body-sm"
          />
          <button type="submit" className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 font-label-md text-label-md font-semibold">
            Terapkan
          </button>
        </form>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden flex flex-col">
        {list.data.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">
            {search || status || unit_id ? 'Tidak ada kegiatan yang cocok dengan filter ini.' : 'Belum ada kegiatan.'}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">No. Kegiatan &amp; Judul</th>
                  {!scoped && <th className="px-space-base py-space-sm font-bold">Unit</th>}
                  <th className="px-space-base py-space-sm font-bold">Jadwal</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Anggaran</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {list.data.map((act) => (
                  <tr key={act.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-space-base py-space-sm">
                      <Link href={`/kegiatan/${act.id}`} className="font-label-lg text-label-lg font-semibold text-primary hover:underline">
                        {act.activity_code}
                      </Link>
                      <div className="font-body-sm text-body-sm text-on-surface font-medium">{act.name}</div>
                    </td>
                    {!scoped && <td className="px-space-base py-space-sm text-on-surface-variant">{act.unit?.name}</td>}
                    <td className="px-space-base py-space-sm text-on-surface-variant whitespace-nowrap">
                      {act.start_date}
                      {act.end_date !== act.start_date ? ` – ${act.end_date}` : ''}
                    </td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell tabular-nums">{formatRupiah(act.budget_amount)}</td>
                    <td className="px-space-base py-space-sm text-center">
                      <StatusBadge status={act.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar meta={list.meta} basePath="/kegiatan" params={{ status: status || undefined, ...keep }} />
      </div>
    </div>
  );
}
