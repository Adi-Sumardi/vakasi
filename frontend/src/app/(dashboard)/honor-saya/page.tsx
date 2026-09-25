import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/common/page-header';
import { PaginationBar } from '@/components/common/pagination-bar';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { meServer } from '@/lib/api/auth.server';
import { serverApiFetchPage, toQuery } from '@/lib/api/server';
import { formatRupiah } from '@/lib/format';

type MyHonor = {
  id: number;
  employee_id: number;
  role_name: string | null;
  honor_type: string | null;
  rate: number;
  volume: number;
  unit: string;
  amount: number;
  activity: {
    id: number;
    activity_code: string;
    name: string;
    unit: string | null;
    start_date: string | null;
    status: string;
    disbursement_state: string | null;
    paid_at: string | null;
  };
};

/** "Honor Saya": the signed-in employee's own honor lines and slips. */
export default async function HonorSayaPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const me = await meServer();
  const list = await serverApiFetchPage<MyHonor>(`/api/v1/my-honors${toQuery({ page })}`);
  const paid = list.data.filter((h) => h.activity.disbursement_state === 'dibayar').reduce((s, h) => s + h.amount, 0);

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: 'Honor Saya' }]}
        title={<>Honor Saya</>}
        description={<>Kegiatan yang Anda ikuti sebagai panitia, honornya, dan status pembayarannya.</>}
      />

      {!me.employee_id && (
        <div className="p-space-lg rounded-xl bg-error-container text-on-error-container font-body-sm text-body-sm">
          Akun Anda belum terhubung ke data pegawai. Hubungi admin untuk menautkannya.
        </div>
      )}

      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 w-fit">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Sudah dibayar (halaman ini)</span>
        <div className="font-currency-display text-headline-sm text-tertiary font-bold mt-space-2xs tabular-nums">{formatRupiah(paid)}</div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {list.data.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">Belum ada honor untuk Anda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Kegiatan</th>
                  <th className="px-space-base py-space-sm font-bold">Peran</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Jumlah</th>
                  <th className="px-space-base py-space-sm font-bold">Pembayaran</th>
                  <th className="px-space-base py-space-sm w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {list.data.map((h) => (
                  <tr key={h.id}>
                    <td className="px-space-base py-space-sm">
                      <div className="font-semibold text-on-surface">{h.activity.name}</div>
                      <div className="text-outline text-xs">
                        {h.activity.activity_code} · {h.activity.unit ?? '-'} · {h.activity.start_date ?? '-'}
                      </div>
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">
                      <div>{h.role_name ?? '-'}</div>
                      <div className="text-outline text-xs">
                        {h.honor_type} · {formatRupiah(h.rate)} × {h.volume} {h.unit}
                      </div>
                    </td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-primary font-bold tabular-nums">{formatRupiah(h.amount)}</td>
                    <td className="px-space-base py-space-sm">
                      <StatusBadge status={h.activity.disbursement_state ?? h.activity.status} />
                      {h.activity.paid_at && <div className="text-outline text-xs mt-1">{h.activity.paid_at.slice(0, 10)}</div>}
                    </td>
                    <td className="px-space-base py-space-sm text-center">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/activities/${h.activity.id}/employees/${h.employee_id}/honor-slip`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Unduh slip honor"
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
        <PaginationBar meta={list.meta} basePath="/honor-saya" />
      </div>
    </div>
  );
}
