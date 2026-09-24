import { Unauthorized } from '@/components/layout/unauthorized';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { PaymentActions } from '@/components/keuangan/payment-actions';
import { listPaymentsServer } from '@/lib/api/payments.server';
import { meServer } from '@/lib/api/auth.server';
import { hasPermission } from '@/lib/api/auth';
import { formatRupiah } from '@/lib/format';

export default async function PembayaranPage() {
  const me = await meServer();

  if (!hasPermission(me, 'payments.view')) {
    return <Unauthorized />;
  }

  const payments = await listPaymentsServer();

  // "verified" is money committed but not yet disbursed (FR-10), so it
  // belongs in the outstanding figure alongside "processing".
  const totalOutstanding = payments
    .filter((p) => p.status === 'verified' || p.status === 'processing')
    .reduce((sum, p) => sum + p.total_amount, 0);
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Pembayaran Honorarium</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Proses pembayaran, unggah bukti transfer, dan selesaikan pencairan honor.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Belum Dicairkan</span>
          <div className="font-currency-display text-headline-sm text-primary font-bold mt-space-2xs">{formatRupiah(totalOutstanding)}</div>
        </div>
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Sudah Dibayar</span>
          <div className="font-currency-display text-headline-sm text-tertiary font-bold mt-space-2xs">{formatRupiah(totalPaid)}</div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">
            Belum ada pembayaran. Buat pembayaran dari halaman detail kegiatan yang sudah disetujui.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">No. Pembayaran</th>
                  <th className="px-space-base py-space-sm font-bold">Kegiatan</th>
                  <th className="px-space-base py-space-sm font-bold">Metode</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Total</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Status</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-space-base py-space-sm font-label-md text-label-md font-semibold text-primary">{p.payment_number}</td>
                    <td className="px-space-base py-space-sm">
                      <div className="font-medium text-on-surface">{p.activity.activity_code}</div>
                      <div className="text-outline text-xs">{p.activity.name}</div>
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">{p.payment_method}</td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell">{formatRupiah(p.total_amount)}</td>
                    <td className="px-space-base py-space-sm text-center"><StatusBadge status={p.status} /></td>
                    <td className="px-space-base py-space-sm text-center"><PaymentActions payment={p} /></td>
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
