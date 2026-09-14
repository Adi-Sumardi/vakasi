import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { Unauthorized } from '@/components/layout/unauthorized';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { serverApiFetch } from '@/lib/api/server';
import { meServer } from '@/lib/api/auth.server';
import { hasPermission } from '@/lib/api/auth';
import type { Payment } from '@/lib/api/payments';
import { formatRupiah } from '@/lib/format';

const REPORT_LINKS = [
  { href: '/kegiatan', icon: 'event_available', label: 'Laporan Kegiatan', desc: 'Seluruh kegiatan dan statusnya' },
  { href: '/honor', icon: 'payments', label: 'Laporan Honor', desc: 'Rekap honor per pegawai & kegiatan' },
  { href: '/keuangan/anggaran', icon: 'account_balance_wallet', label: 'Anggaran vs Realisasi', desc: 'Pagu, terpakai, dan sisa anggaran' },
];

export default async function LaporanPage() {
  const me = await meServer();

  if (!hasPermission(me, 'reports.view')) {
    return <Unauthorized />;
  }

  const payments = await serverApiFetch<Payment[]>('/api/v1/reports/payments');

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Laporan</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Pusat laporan kegiatan, honor, anggaran, dan pembayaran sekolah.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        {REPORT_LINKS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 hover:border-primary/40 transition-all flex items-start gap-space-md"
          >
            <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <Icon name={r.icon} className="text-[20px]" />
            </div>
            <div>
              <div className="font-label-lg text-label-lg font-bold text-on-surface">{r.label}</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">{r.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        <div className="p-space-lg border-b border-outline-variant/30">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Daftar Pembayaran</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">Belum ada pembayaran.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">No. Pembayaran</th>
                  <th className="px-space-base py-space-sm font-bold">Kegiatan</th>
                  <th className="px-space-base py-space-sm font-bold">Tanggal</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Total</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/50">
                    <td className="px-space-base py-space-sm font-label-md text-label-md font-semibold text-primary">{p.payment_number}</td>
                    <td className="px-space-base py-space-sm text-on-surface">{p.activity.name}</td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">{p.payment_date}</td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell">{formatRupiah(p.total_amount)}</td>
                    <td className="px-space-base py-space-sm text-center"><StatusBadge status={p.status} /></td>
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
