import Link from 'next/link';
import { HeroButton, HeroStat, PageHeader } from '@/components/common/page-header';

import { Unauthorized } from '@/components/layout/unauthorized';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { hasPermission } from '@/lib/api/auth';
import { meServer } from '@/lib/api/auth.server';
import type { Budget } from '@/lib/api/activities';
import { serverApiFetch } from '@/lib/api/server';
import { formatRupiah } from '@/lib/format';

type BudgetRow = Budget & {
  disbursed_amount: number;
  activity: { id: number; activity_code: string; name: string; status: string; unit: string | null; fund_source: string | null };
};

/**
 * Pagu vs realisasi. "Sudah dibayar" mirrors Sianggar's "paid" callback —
 * VAKASI's own payment module is off, so its paid_amount is always 0.
 */
export default async function AnggaranPage() {
  const me = await meServer();

  if (!hasPermission(me, 'reports.view')) {
    return <Unauthorized />;
  }

  const budgets = await serverApiFetch<BudgetRow[]>('/api/v1/reports/budget?per_page=1000');

  const sum = (rows: BudgetRow[], key: 'budget_amount' | 'approved_amount' | 'disbursed_amount') =>
    rows.reduce((s, b) => s + (b[key] ?? 0), 0);

  const byUnit = Object.entries(
    budgets.reduce<Record<string, BudgetRow[]>>((acc, b) => {
      const unit = b.activity.unit ?? 'Tanpa unit';
      (acc[unit] ??= []).push(b);
      return acc;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b));

  const totals = [
    { label: 'Total pagu', value: sum(budgets, 'budget_amount') },
    { label: 'Honor disetujui', value: sum(budgets, 'approved_amount') },
    { label: 'Sudah dibayar (Sianggar)', value: sum(budgets, 'disbursed_amount') },
    { label: 'Sisa pagu', value: sum(budgets, 'budget_amount') - sum(budgets, 'approved_amount') },
  ];

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: 'Honor & Anggaran' }, { label: 'Anggaran' }]}
        title="Anggaran"
        description="Pagu kegiatan, honor yang disetujui, dan yang sudah dibayar lewat Sianggar, per unit."
        actions={
          <HeroButton href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/export/anggaran`} icon="download" external>
            Export Excel
          </HeroButton>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm">
          {totals.map((t) => (
            <HeroStat key={t.label} label={t.label} value={formatRupiah(t.value)} />
          ))}
        </div>
      </PageHeader>


      {byUnit.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">
          Belum ada data anggaran.
        </div>
      ) : (
        byUnit.map(([unit, rows]) => (
          <section key={unit} className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
            <div className="p-space-base flex flex-wrap items-baseline justify-between gap-space-sm border-b border-outline-variant/30">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{unit}</h2>
              <span className="font-body-sm text-body-sm text-on-surface-variant tabular-nums">
                Pagu {formatRupiah(sum(rows, 'budget_amount'))} · disetujui {formatRupiah(sum(rows, 'approved_amount'))} · dibayar {formatRupiah(sum(rows, 'disbursed_amount'))}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm border-collapse">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                  <tr>
                    <th className="px-space-base py-space-sm font-bold">Kegiatan</th>
                    <th className="px-space-base py-space-sm font-bold">Sumber Dana</th>
                    <th className="px-space-base py-space-sm font-bold">Status</th>
                    <th className="px-space-base py-space-sm text-right font-bold">Pagu</th>
                    <th className="px-space-base py-space-sm text-right font-bold">Disetujui</th>
                    <th className="px-space-base py-space-sm text-right font-bold">Dibayar</th>
                    <th className="px-space-base py-space-sm text-right font-bold">Sisa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low tabular-nums">
                  {rows.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-container-low/50">
                      <td className="px-space-base py-space-sm">
                        <Link href={`/kegiatan/${b.activity.id}`} className="text-primary font-semibold hover:underline">
                          {b.activity.activity_code}
                        </Link>
                        <div className="text-outline text-xs">{b.activity.name}</div>
                      </td>
                      <td className="px-space-base py-space-sm text-on-surface-variant">{b.activity.fund_source ?? '-'}</td>
                      <td className="px-space-base py-space-sm"><StatusBadge status={b.activity.status} /></td>
                      <td className="px-space-base py-space-sm text-right font-currency-cell">{formatRupiah(b.budget_amount)}</td>
                      <td className="px-space-base py-space-sm text-right font-currency-cell">{formatRupiah(b.approved_amount)}</td>
                      <td className="px-space-base py-space-sm text-right font-currency-cell text-tertiary">{formatRupiah(b.disbursed_amount)}</td>
                      <td className="px-space-base py-space-sm text-right font-currency-cell">{formatRupiah(b.budget_amount - b.approved_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
