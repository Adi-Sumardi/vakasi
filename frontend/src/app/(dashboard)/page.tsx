import Link from 'next/link';

import { HeroButton, HeroStat, PageHeader } from '@/components/common/page-header';
import { StatCard, type Tone } from '@/components/common/stat-card';
import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { meServer } from '@/lib/api/auth.server';
import { hasPermission, roleLabel } from '@/lib/api/auth';
import { DISBURSEMENT_STATES, type DashboardActivityRow, type DashboardSummary } from '@/lib/api/dashboard';
import { serverApiFetch } from '@/lib/api/server';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATE_TINT: Record<string, string> = {
  belum_terkirim: 'bg-error-container text-on-error-container',
  menunggu_sdm: 'bg-gold-soft text-on-gold',
  diproses: 'bg-primary-fixed text-on-primary-fixed-variant',
  dibayar: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  ditolak: 'bg-surface-container text-on-surface-variant',
};

/**
 * One dashboard, filled per role from GET /dashboard: the server only
 * returns the sections this account can act on, so a TU gets a to-do
 * list and a Super Admin gets per-unit totals and data health.
 */
export default async function DashboardPage() {
  const user = await meServer();
  const summary = await serverApiFetch<DashboardSummary>('/api/v1/dashboard');
  const canCreate = hasPermission(user, 'activities.create');

  const todoCount = summary.todo
    ? summary.todo.missing_sk_panitia.length + summary.todo.missing_honor.length + summary.todo.rejected.length
    : 0;

  const stats: { label: string; value: number; icon: string; tone: Tone; href: string }[] = [
    { label: 'Draft', value: summary.status_counts.draft, icon: 'edit_note', tone: 'slate', href: '/kegiatan?status=draft' },
    { label: 'Menunggu Approval', value: summary.status_counts.submitted, icon: 'hourglass_top', tone: 'amber', href: '/kegiatan?status=submitted' },
    { label: 'Disetujui', value: summary.status_counts.approved, icon: 'check_circle', tone: 'green', href: '/kegiatan?status=approved' },
    { label: 'Ditolak / Revisi', value: summary.status_counts.rejected, icon: 'error', tone: 'red', href: '/kegiatan?status=rejected' },
  ];

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full gap-space-xl">
      <PageHeader
        eyebrow={`${roleLabel(user)} · ${summary.scope.unit ?? 'Semua unit'}`}
        title={`Selamat datang, ${user?.name}`}
        description={
          canCreate
            ? todoCount > 0
              ? `Ada ${todoCount} kegiatan yang perlu Anda lengkapi.`
              : 'Semua kegiatan Anda sudah lengkap.'
            : 'Ringkasan kegiatan dan honor tahun ini.'
        }
        actions={canCreate ? <HeroButton href="/kegiatan/buat" icon="add">Buat Kegiatan</HeroButton> : undefined}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
          <HeroStat label="Honor disetujui tahun ini" value={formatRupiah(summary.honor_approved_this_year)} />
          <HeroStat label="Sudah dibayar (Sianggar)" value={formatRupiah(summary.honor_paid_this_year)} />
          <HeroStat label="Kegiatan baru bulan ini" value={summary.activities_this_month} />
        </div>
      </PageHeader>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
        {stats.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={card.tone} href={card.href} />
        ))}
      </section>

      <Link href="/pencairan" className="lift bg-surface-container-lowest p-space-lg rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Status pencairan tahun ini</span>
          <Icon name="chevron_right" className="text-outline" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-space-sm">
          {DISBURSEMENT_STATES.map((state) => (
            <div key={state.key} className={cn('flex flex-col rounded-xl px-space-md py-space-sm', STATE_TINT[state.key])}>
              <span className="font-headline-sm text-headline-sm font-bold tabular-nums">{summary.disbursement_counts[state.key]}</span>
              <span className="font-body-sm text-body-sm">{state.label}</span>
            </div>
          ))}
        </div>
      </Link>

      {(summary.sianggar_failed ?? 0) > 0 && (
        <Link
          href="/integrasi/sianggar"
          className="flex items-center justify-between gap-space-md p-space-lg rounded-xl bg-error-container text-on-error-container"
        >
          <span className="flex items-center gap-space-sm font-label-lg text-label-lg font-semibold">
            <Icon name="cloud_off" className="text-[20px]" />
            {summary.sianggar_failed} kegiatan gagal terkirim ke Sianggar
          </span>
          <span className="font-label-md text-label-md">Kirim ulang</span>
        </Link>
      )}

      {summary.todo && todoCount > 0 && (
        <Panel title="Perlu dilengkapi">
          <TodoList title="SK Panitia belum diunggah" rows={summary.todo.missing_sk_panitia} />
          <TodoList title="Honor belum dihitung" rows={summary.todo.missing_honor} />
          <TodoList title="Ditolak / diminta revisi" rows={summary.todo.rejected} />
        </Panel>
      )}

      {summary.awaiting_approval && (
        <Panel title="Menunggu persetujuan Anda" action={{ href: '/kegiatan/approval', label: 'Lihat semua' }}>
          <ActivityRows rows={summary.awaiting_approval} empty="Tidak ada kegiatan yang menunggu persetujuan." />
        </Panel>
      )}

      {summary.per_unit && (
        <Panel title="Rekap per unit tahun ini">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-lg py-space-sm font-bold">Unit</th>
                  <th className="px-space-lg py-space-sm text-right font-bold">Kegiatan</th>
                  <th className="px-space-lg py-space-sm text-right font-bold">Menunggu</th>
                  <th className="px-space-lg py-space-sm text-right font-bold">Disetujui</th>
                  <th className="px-space-lg py-space-sm text-right font-bold">Honor Disetujui</th>
                  <th className="px-space-lg py-space-sm text-right font-bold">Total Anggaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low tabular-nums">
                {summary.per_unit.map((row) => (
                  <tr key={row.unit}>
                    <td className="px-space-lg py-space-sm font-medium text-on-surface">{row.unit}</td>
                    <td className="px-space-lg py-space-sm text-right">{row.activities}</td>
                    <td className="px-space-lg py-space-sm text-right">{row.submitted}</td>
                    <td className="px-space-lg py-space-sm text-right">{row.approved}</td>
                    <td className="px-space-lg py-space-sm text-right font-currency-cell">{formatRupiah(row.honor_approved)}</td>
                    <td className="px-space-lg py-space-sm text-right font-currency-cell">{formatRupiah(row.budget_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {summary.data_health && (
        <Panel title="Kelengkapan data">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-outline-variant/30">
            <HealthTile
              label="Pegawai aktif"
              value={summary.data_health.employees_total}
              bad={summary.data_health.employees_total === 0}
              hint={summary.data_health.employees_total === 0 ? 'Import pegawai dulu — panitia belum bisa dipilih.' : undefined}
              href="/master-data/pegawai"
            />
            <HealthTile
              label="Pegawai tanpa rekening"
              value={summary.data_health.employees_without_bank}
              bad={summary.data_health.employees_without_bank > 0}
              href="/master-data/pegawai"
            />
            <HealthTile
              label="Tarif tanpa nomor/berkas SK"
              value={Math.max(summary.data_health.rates_without_decree, summary.data_health.rates_without_decree_file)}
              bad={summary.data_health.rates_without_decree + summary.data_health.rates_without_decree_file > 0}
              href="/master-data/honor?tab=tarif"
            />
            <HealthTile
              label="Unit tanpa akun Kepala Sekolah"
              value={summary.data_health.units_without_kepala_sekolah}
              bad={summary.data_health.units_without_kepala_sekolah > 0}
              href="/pengaturan"
            />
          </div>
        </Panel>
      )}

      <Panel title="Kegiatan terbaru" action={{ href: '/kegiatan', label: 'Lihat semua' }}>
        <ActivityRows rows={summary.recent} empty="Belum ada kegiatan." />
      </Panel>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 overflow-hidden">
      <div className="p-space-lg border-b border-outline-variant/30 flex items-center justify-between gap-space-md">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{title}</h2>
        {action && (
          <Link href={action.href} className="text-primary font-label-sm text-label-sm font-semibold hover:underline">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ActivityRows({ rows, empty }: { rows: DashboardActivityRow[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="p-space-lg font-body-sm text-body-sm text-on-surface-variant">{empty}</p>;
  }

  return (
    <div className="divide-y divide-surface-container-low">
      {rows.map((a) => (
        <Link key={a.id} href={`/kegiatan/${a.id}`} className="flex items-center justify-between gap-space-md p-space-lg hover:bg-surface-container-low/50 transition-colors">
          <div className="min-w-0">
            <div className="font-label-md text-label-md font-semibold text-on-surface truncate">
              {a.activity_code} · {a.name}
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              {a.unit ?? '-'} · {a.start_date ?? '-'}
            </div>
          </div>
          <div className="flex items-center gap-space-md shrink-0">
            <span className="hidden sm:inline font-currency-cell text-currency-cell text-on-surface tabular-nums">{formatRupiah(a.budget_amount)}</span>
            <StatusBadge status={a.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function TodoList({ title, rows }: { title: string; rows: DashboardActivityRow[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-outline-variant/30 last:border-b-0">
      <div className="px-space-lg pt-space-md font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
        {title} ({rows.length})
      </div>
      <ActivityRows rows={rows} empty="" />
    </div>
  );
}

function HealthTile({ label, value, bad, hint, href }: { label: string; value: number; bad: boolean; hint?: string; href: string }) {
  return (
    <Link href={href} className="bg-surface-container-lowest p-space-lg flex flex-col gap-space-2xs hover:bg-surface-container-low/50 transition-colors">
      <span className="font-body-sm text-body-sm text-on-surface-variant">{label}</span>
      <span className={cn('font-headline-sm text-headline-sm font-bold tabular-nums', bad ? 'text-error' : 'text-on-surface')}>{value}</span>
      {hint && <span className="font-body-sm text-body-sm text-error">{hint}</span>}
    </Link>
  );
}
