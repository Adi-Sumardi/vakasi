import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { listHonorReportServer } from '@/lib/api/reports.server';
import { formatRupiah } from '@/lib/format';

export default async function RekapHonorPage() {
  const rows = await listHonorReportServer();
  const totalNet = rows.reduce((sum, r) => sum + r.net_amount, 0);

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Rekap Honor</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Seluruh detail honor yang telah dihitung di semua kegiatan.
        </p>
      </div>

      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 w-fit">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Honor Netto</span>
        <div className="font-currency-display text-headline-sm text-primary font-bold mt-space-2xs">{formatRupiah(totalNet)}</div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">
            Belum ada honor yang dihitung.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Pegawai</th>
                  <th className="px-space-base py-space-sm font-bold">Kegiatan</th>
                  <th className="px-space-base py-space-sm font-bold">Jenis Honor</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Gross</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Potongan</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Netto</th>
                  <th className="px-space-base py-space-sm w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/50">
                    <td className="px-space-base py-space-sm font-medium text-on-surface">{r.employee.name}</td>
                    <td className="px-space-base py-space-sm">
                      <Link href={`/kegiatan/${r.activity.id}`} className="text-primary font-semibold hover:underline">
                        {r.activity.activity_code}
                      </Link>
                      <div className="text-outline text-xs">{r.activity.name}</div>
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">{r.honor_type.name}</td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell">{formatRupiah(r.gross_amount)}</td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell text-error">
                      -{formatRupiah(r.tax_amount + r.deduction_amount)}
                    </td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell text-primary font-bold">{formatRupiah(r.net_amount)}</td>
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
      </div>
    </div>
  );
}
