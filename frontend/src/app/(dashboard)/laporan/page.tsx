import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/common/page-header';
import { Unauthorized } from '@/components/layout/unauthorized';
import { hasPermission } from '@/lib/api/auth';
import { meServer } from '@/lib/api/auth.server';
import type { Unit } from '@/lib/api/master-data';
import { serverApiFetch } from '@/lib/api/server';

const REPORTS = [
  { type: 'kegiatan', icon: 'calendar_month', label: 'Daftar Kegiatan', desc: 'Semua kegiatan dengan status, jumlah panitia, anggaran, dan total honor.' },
  { type: 'honor', icon: 'receipt_long', label: 'Rincian Honor per Pegawai', desc: 'Satu baris per pegawai per kegiatan, lengkap dengan peran, SK tarif, dan rekening.' },
  { type: 'anggaran', icon: 'account_balance_wallet', label: 'Anggaran vs Realisasi', desc: 'Pagu, honor disetujui, dan yang sudah dibayar lewat Sianggar.' },
  { type: 'pencairan', icon: 'send', label: 'Status Pencairan', desc: 'Posisi setiap kegiatan yang disetujui di Sianggar, nomor pengajuan, dan tanggal bayar.' },
] as const;

/**
 * Pusat export. Each report downloads as a CSV that Excel opens straight
 * into columns; the filters below apply to whichever report is chosen.
 * The form submits directly to the API (GET), so the browser downloads
 * the file with the user's session cookie.
 */
export default async function LaporanPage() {
  const me = await meServer();

  if (!hasPermission(me, 'reports.view')) {
    return <Unauthorized />;
  }

  const scoped = !!me.scoped_unit_id;
  const units = scoped ? [] : await serverApiFetch<Unit[]>('/api/v1/units?per_page=1000');
  const api = process.env.NEXT_PUBLIC_API_URL;
  const year = new Date().getFullYear();

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: 'Laporan' }]}
        title={<>{scoped ? 'Laporan Unit' : 'Laporan & Export'}</>}
        description={<>Pilih laporan, atur periode{scoped ? '' : ' dan unit'}, lalu unduh sebagai file Excel (CSV).</>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {REPORTS.map((r) => (
          <form
            key={r.type}
            method="GET"
            action={`${api}/api/v1/reports/export/${r.type}`}
            className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 flex flex-col gap-space-md"
          >
            <div className="flex items-start gap-space-md">
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                <Icon name={r.icon} className="text-[20px]" />
              </div>
              <div>
                <h2 className="font-label-lg text-label-lg font-bold text-on-surface">{r.label}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{r.desc}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-space-sm">
              {!scoped && (
                <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
                  Unit
                  <select name="unit_id" defaultValue="" className="h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm">
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
                Dari
                <input type="date" name="start_date" defaultValue={`${year}-01-01`} className="h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm" />
              </label>
              <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
                Sampai
                <input type="date" name="end_date" defaultValue={`${year}-12-31`} className="h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm" />
              </label>
              <button type="submit" className="h-9 px-4 inline-flex items-center gap-1 rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold">
                <Icon name="download" className="text-sm text-white" />
                Unduh
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
