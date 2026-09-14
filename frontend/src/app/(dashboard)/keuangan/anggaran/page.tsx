import Link from 'next/link';

import { Unauthorized } from '@/components/layout/unauthorized';
import { serverApiFetch } from '@/lib/api/server';
import { meServer } from '@/lib/api/auth.server';
import { hasPermission } from '@/lib/api/auth';
import type { Budget } from '@/lib/api/activities';
import { formatRupiah } from '@/lib/format';

type BudgetRow = Budget & { activity: { id: number; activity_code: string; name: string } };

export default async function AnggaranPage() {
  const me = await meServer();

  if (!hasPermission(me, 'reports.view')) {
    return <Unauthorized />;
  }

  const budgets = await serverApiFetch<BudgetRow[]>('/api/v1/reports/budget');

  const totalBudget = budgets.reduce((s, b) => s + b.budget_amount, 0);
  const totalPaid = budgets.reduce((s, b) => s + b.paid_amount, 0);
  const totalRemaining = budgets.reduce((s, b) => s + b.remaining_amount, 0);

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Anggaran</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Ringkasan pagu, realisasi, dan sisa anggaran per kegiatan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Pagu</span>
          <div className="font-currency-display text-headline-sm text-on-surface font-bold mt-space-2xs">{formatRupiah(totalBudget)}</div>
        </div>
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Dibayar</span>
          <div className="font-currency-display text-headline-sm text-primary font-bold mt-space-2xs">{formatRupiah(totalPaid)}</div>
        </div>
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Sisa Anggaran</span>
          <div className="font-currency-display text-headline-sm text-tertiary font-bold mt-space-2xs">{formatRupiah(totalRemaining)}</div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {budgets.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">Belum ada data anggaran.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Kegiatan</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Pagu</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Diajukan</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Dibayar</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Sisa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-space-base py-space-sm">
                      <Link href={`/kegiatan/${b.activity.id}`} className="text-primary font-semibold hover:underline">
                        {b.activity.activity_code}
                      </Link>
                      <div className="text-outline text-xs">{b.activity.name}</div>
                    </td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell">{formatRupiah(b.budget_amount)}</td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell">{formatRupiah(b.committed_amount)}</td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell">{formatRupiah(b.paid_amount)}</td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell text-tertiary font-bold">{formatRupiah(b.remaining_amount)}</td>
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
