import Link from 'next/link';
import { PageHeader } from '@/components/common/page-header';

import { PageTabs } from '@/components/common/page-tabs';
import { PaginationBar } from '@/components/common/pagination-bar';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import type { Activity } from '@/lib/api/activities';
import { meServer } from '@/lib/api/auth.server';
import { DISBURSEMENT_STATES, type DisbursementState } from '@/lib/api/dashboard';
import { serverApiFetchPage, toQuery, type PageMeta } from '@/lib/api/server';
import { formatRupiah } from '@/lib/format';

type Meta = PageMeta & { counts: Record<DisbursementState, number> };

const STAGE_LABEL: Record<string, string> = {
  'staff-keuangan': 'Staf Keuangan',
  direktur: 'Direktur',
  'kabag-sdm-umum': 'Kabag SDM & Umum',
  'kabag-sekretariat': 'Kabag Sekretariat',
  'wakil-ketua': 'Wakil Ketua',
  sekretaris: 'Sekretaris',
  ketum: 'Ketua Umum',
  keuangan: 'Keuangan',
  bendahara: 'Bendahara',
  kasir: 'Kasir',
  payment: 'Pembayaran',
};

/**
 * Where each approved activity's honor stands in Sianggar, from the
 * callbacks Sianggar sends back. Answers the TU's usual question:
 * "sudah dibayar belum?"
 */
export default async function PencairanPage({ searchParams }: { searchParams: Promise<{ state?: string; page?: string }> }) {
  const { state = '', page } = await searchParams;
  const user = await meServer();
  const list = await serverApiFetchPage<Activity, Meta>(`/api/v1/disbursements${toQuery({ state, page })}`);
  const total = Object.values(list.meta.counts ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: 'Kegiatan', href: '/kegiatan' }, { label: 'Status Pencairan' }]}
        title={<>Status Pencairan</>}
        description={<>Kegiatan yang sudah disetujui{user?.scoped_unit_id ? ` di ${user.unit?.name ?? 'unit Anda'}` : ''} dan posisi pencairan honornya di Sianggar.</>}
      />

      <PageTabs
        active={state}
        tabs={[
          { key: '', label: 'Semua', href: '/pencairan', count: total },
          ...DISBURSEMENT_STATES.map((s) => ({
            key: s.key,
            label: s.label,
            href: `/pencairan?state=${s.key}`,
            count: list.meta.counts?.[s.key] ?? 0,
          })),
        ]}
      />

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {list.data.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">
            Belum ada kegiatan pada status ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Kegiatan</th>
                  <th className="px-space-base py-space-sm font-bold">Disetujui</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Honor</th>
                  <th className="px-space-base py-space-sm font-bold">Status</th>
                  <th className="px-space-base py-space-sm font-bold">Posisi di Sianggar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {list.data.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-container-low/50 align-top">
                    <td className="px-space-base py-space-sm">
                      <Link href={`/kegiatan/${a.id}`} className="font-semibold text-primary hover:underline">
                        {a.activity_code}
                      </Link>
                      <div className="text-on-surface">{a.name}</div>
                      <div className="text-outline text-xs">{a.unit?.name}</div>
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant whitespace-nowrap">{a.approved_at?.slice(0, 10) ?? '-'}</td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell tabular-nums">
                      {formatRupiah(a.disbursement?.approved_amount ?? a.budget?.approved_amount ?? 0)}
                    </td>
                    <td className="px-space-base py-space-sm">
                      {a.disbursement_state && <StatusBadge status={a.disbursement_state} />}
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">
                      {a.disbursement ? (
                        <div className="flex flex-col gap-0.5">
                          {a.disbursement.nomor_pengajuan && <span className="text-on-surface">No. {a.disbursement.nomor_pengajuan}</span>}
                          {a.disbursement_state === 'diproses' && a.disbursement.current_stage && (
                            <span>Di tahap {STAGE_LABEL[a.disbursement.current_stage] ?? a.disbursement.current_stage}</span>
                          )}
                          {a.disbursement.paid_at && (
                            <span>
                              Dibayar {a.disbursement.paid_at.slice(0, 10)}
                              {a.disbursement.no_voucher ? ` · voucher ${a.disbursement.no_voucher}` : ''}
                            </span>
                          )}
                          {a.disbursement.last_note && a.disbursement_state === 'ditolak' && (
                            <span className="text-error">Catatan: {a.disbursement.last_note}</span>
                          )}
                        </div>
                      ) : a.disbursement_state === 'belum_terkirim' ? (
                        <span className="text-error">{a.sianggar_last_error ?? 'Belum terkirim ke Sianggar.'}</span>
                      ) : (
                        <span>Menunggu ditinjau SDM</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar meta={list.meta} basePath="/pencairan" params={{ state: state || undefined }} />
      </div>
    </div>
  );
}
