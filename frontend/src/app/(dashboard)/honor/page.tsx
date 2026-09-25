import Link from 'next/link';
import { HeroButton, PageHeader } from '@/components/common/page-header';

import { Icon } from '@/components/ui/icon';
import { PaginationBar } from '@/components/common/pagination-bar';
import { meServer } from '@/lib/api/auth.server';
import type { Unit } from '@/lib/api/master-data';
import type { HonorReportRow } from '@/lib/api/reports.server';
import { serverApiFetch, serverApiFetchPage, toQuery } from '@/lib/api/server';
import { formatRupiah } from '@/lib/format';

type Search = { unit_id?: string; start_date?: string; end_date?: string; page?: string };

/**
 * Every calculated honor line, filterable by unit and period, with the
 * same filters carried into the Excel export. One amount column: honor
 * panitia has no tax or deduction in this flow.
 */
export default async function RekapHonorPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { unit_id = '', start_date = '', end_date = '', page } = await searchParams;
  const user = await meServer();
  const scoped = !!user?.scoped_unit_id;
  const filters = { unit_id, start_date, end_date };

  const [list, units] = await Promise.all([
    serverApiFetchPage<HonorReportRow>(`/api/v1/reports/honors${toQuery({ ...filters, page })}`),
    scoped ? Promise.resolve([] as Unit[]) : serverApiFetch<Unit[]>('/api/v1/units?per_page=1000'),
  ]);

  const exportHref = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/export/honor${toQuery(filters)}`;

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: 'Honor' }, { label: scoped ? 'Rekap Honor Unit' : 'Rekap Honor' }]}
        title={scoped ? 'Rekap Honor Unit' : 'Rekap Honor'}
        description="Seluruh honor panitia yang sudah dihitung, per pegawai dan kegiatan."
        actions={
          <HeroButton href={exportHref} icon="download" external>
            Export Excel
          </HeroButton>
        }
      />

      <form action="/honor" className="flex flex-wrap items-end gap-space-sm bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30">
        {!scoped && (
          <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
            Unit
            <select name="unit_id" defaultValue={unit_id} className="h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm">
              <option value="">Semua unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
          Dari tanggal
          <input type="date" name="start_date" defaultValue={start_date} className="h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm" />
        </label>
        <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
          Sampai tanggal
          <input type="date" name="end_date" defaultValue={end_date} className="h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm" />
        </label>
        <button type="submit" className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold">
          Terapkan
        </button>
        {(unit_id || start_date || end_date) && (
          <Link href="/honor" className="h-9 px-3 inline-flex items-center rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md text-label-md">
            Reset
          </Link>
        )}
      </form>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {list.data.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">Belum ada honor pada filter ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Kegiatan</th>
                  <th className="px-space-base py-space-sm font-bold">Pegawai / Peran</th>
                  <th className="px-space-base py-space-sm font-bold">Jenis Honor</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Tarif × Volume</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Jumlah</th>
                  <th className="px-space-base py-space-sm w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {list.data.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/50">
                    <td className="px-space-base py-space-sm">
                      <Link href={`/kegiatan/${r.activity.id}`} className="text-primary font-semibold hover:underline">
                        {r.activity.activity_code}
                      </Link>
                      <div className="text-outline text-xs">{r.activity.name}</div>
                    </td>
                    <td className="px-space-base py-space-sm">
                      <div className="text-on-surface font-medium">{r.employee.name}</div>
                      {r.role_name && <div className="text-outline text-xs">{r.role_name}</div>}
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">
                      <div>{r.honor_type.name}</div>
                      {r.rate_decree_number && <div className="text-outline text-xs">SK Tarif: {r.rate_decree_number}</div>}
                    </td>
                    <td className="px-space-base py-space-sm text-right text-on-surface-variant tabular-nums whitespace-nowrap">
                      {formatRupiah(r.rate_snapshot)} × {r.volume} {r.unit_snapshot}
                    </td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell text-primary font-bold tabular-nums">
                      {formatRupiah(r.net_amount)}
                    </td>
                    <td className="px-space-base py-space-sm text-center">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/activities/${r.activity.id}/employees/${r.employee.id}/honor-slip`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Cetak Slip"
                        className="inline-flex p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors"
                      >
                        <Icon name="description" className="text-[18px]" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar meta={list.meta} basePath="/honor" params={{ unit_id: unit_id || undefined, start_date: start_date || undefined, end_date: end_date || undefined }} />
      </div>
    </div>
  );
}
