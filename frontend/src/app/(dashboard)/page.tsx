import Link from 'next/link';
import { meServer } from '@/lib/api/auth.server';
import { Icon } from '@/components/ui/icon';

export default async function DashboardPage() {
  const user = await meServer();

  return (
    <div className="p-space-base sm:p-space-xl space-y-space-xl">
      {/* Top Greeting & Executive Actions Bar */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg bg-surface-container-lowest p-space-xl rounded-xl shadow-xs border border-outline-variant/30">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              Dashboard Utama Tata Usaha
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Sinkronisasi SPAN-Kemenkeu Terakhir: 09:42 WIB
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Selamat datang kembali, {user.name}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Kelola verifikasi honorarium, validasi berkas SPJ, dan monitor penyerapan pagu DIPA TA 2025.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-md">
          {/* Period Selector */}
          <div className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-low rounded-lg border border-outline-variant/40 shadow-xs cursor-pointer hover:bg-surface-container transition-colors">
            <Icon name="date_range" className="text-primary text-base" />
            <span className="font-label-lg text-label-lg text-on-surface font-semibold">TA 2025 - Triwulan I</span>
            <Icon name="expand_more" className="text-on-surface-variant text-base" />
          </div>

          {/* Secondary Action: Export */}
          <button
            type="button"
            className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg font-label-lg text-label-lg transition-all border border-outline-variant/40 shadow-xs"
          >
            <Icon name="file_download" className="text-secondary text-base" />
            <span>Ekspor Rekap Laporan</span>
          </button>

          {/* Primary Action: New Activity */}
          <Link
            href="/kegiatan/buat"
            className="flex items-center gap-space-xs px-space-lg py-space-sm bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-lg text-label-lg shadow-xs transition-all font-semibold"
          >
            <Icon name="add" className="text-base" />
            <span>+ Buat Kegiatan Baru</span>
          </Link>
        </div>
      </section>

      {/* Summary Metric Cards (5 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        {/* Card 1: Draft Kegiatan */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Draft Kegiatan
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <Icon name="edit_note" className="text-base" />
            </div>
          </div>
          <div className="my-space-sm">
            <span className="font-currency-display text-currency-display text-on-surface tabular-nums">4</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary" />
            <span className="font-body-sm text-body-sm text-on-surface-variant">Perlu dilengkapi TU</span>
          </div>
        </div>

        {/* Card 2: Menunggu Approval */}
        <Link
          href="/kegiatan/approval"
          className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Menunggu Approval
            </span>
            <div className="w-8 h-8 rounded-lg bg-error-container flex items-center justify-center text-on-error-container">
              <Icon name="schedule" className="text-base" />
            </div>
          </div>
          <div className="my-space-sm">
            <span className="font-currency-display text-currency-display text-on-surface tabular-nums group-hover:text-primary transition-colors">
              7
            </span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-error" />
            <span className="font-body-sm text-body-sm text-error font-medium">3 mendekati batas tempo</span>
          </div>
        </Link>

        {/* Card 3: Disetujui PPK */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Disetujui PPK
            </span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant">
              <Icon name="check_circle" className="text-base" />
            </div>
          </div>
          <div className="my-space-sm">
            <span className="font-currency-display text-currency-display text-on-surface tabular-nums">18</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary" />
            <span className="font-body-sm text-body-sm text-tertiary font-medium">Siap diproses Keuangan</span>
          </div>
        </div>

        {/* Card 4: Selesai SPJ */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Selesai SPJ
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-primary">
              <Icon name="done_all" className="text-base" />
            </div>
          </div>
          <div className="my-space-sm">
            <span className="font-currency-display text-currency-display text-on-surface tabular-nums">42</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-body-sm text-body-sm text-on-surface-variant">Telah dicairkan &amp; SPJ</span>
          </div>
        </div>

        {/* Card 5: Total Honor Bulan Ini (Hero Highlight) */}
        <div className="bg-primary-container text-on-primary p-space-lg rounded-xl shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-primary-container uppercase tracking-wider font-semibold">
              Total Honor Mar 2025
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
              <Icon name="account_balance_wallet" className="text-base" />
            </div>
          </div>
          <div className="my-space-sm">
            <span className="font-currency-display text-currency-display text-on-primary tabular-nums tracking-tight">
              Rp 184.650.000
            </span>
          </div>
          <div className="flex items-center justify-between text-on-primary-container">
            <div className="flex items-center gap-space-2xs">
              <Icon name="trending_up" className="text-sm" />
              <span className="font-label-sm text-label-sm font-semibold text-on-tertiary-container bg-tertiary-container/40 px-1.5 py-0.5 rounded">
                +12.4% vs Feb
              </span>
            </div>
            <span className="font-body-sm text-body-sm opacity-90">Netto PPh 21</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid (Two Columns: 8 cols / 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        {/* LEFT COLUMN (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-space-xl">
          {/* Widget: Action Required */}
          <section className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-space-lg flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/20">
              <div className="flex items-center gap-space-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Pengajuan Membutuhkan Tindakan
                </h2>
              </div>
              <span className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                <Icon name="warning" className="text-xs" />
                <span>3 Pengajuan Tertunda &gt; 3 Hari</span>
              </span>
            </div>

            {/* Action Table */}
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                    <th className="py-space-sm px-space-md">No. Kegiatan / Judul</th>
                    <th className="py-space-sm px-space-md">Unit Kerja</th>
                    <th className="py-space-sm px-space-md text-right">Total Honor</th>
                    <th className="py-space-sm px-space-md">Status &amp; Batas Waktu</th>
                    <th className="py-space-sm px-space-md text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {/* Item 1 */}
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-primary">KGT-2025-089</span>
                        <span className="font-body-md text-body-md font-semibold text-on-surface line-clamp-1">
                          Workshop Evaluasi Kurikulum Merdeka
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          SBM 2025: Narasumber &amp; Moderator (5 Orang)
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md whitespace-nowrap">
                      <span className="font-medium text-on-surface">Biro Akademik</span>
                      <span className="block text-on-surface-variant text-[11px]">Akun: 521213</span>
                    </td>
                    <td className="py-space-md px-space-md text-right whitespace-nowrap font-currency-cell text-currency-cell text-on-surface tabular-nums">
                      Rp 24.500.000
                    </td>
                    <td className="py-space-md px-space-md whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-error font-semibold text-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-error" />
                          Menunggu PPK (Sisa 1 Hari)
                        </span>
                        <span className="text-on-surface-variant text-[11px]">Tenggat: 28 Mar 2025</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-space-xs">
                        <Link
                          href="/kegiatan/approval"
                          className="px-space-md py-1 bg-primary text-on-primary rounded font-label-sm text-label-sm hover:bg-primary-container transition-all"
                        >
                          Review
                        </Link>
                        <button
                          type="button"
                          className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-all"
                          title="Kirim Pengingat ke PPK"
                        >
                          <Icon name="notifications_active" className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Item 2 */}
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-primary">KGT-2025-092</span>
                        <span className="font-body-md text-body-md font-semibold text-on-surface line-clamp-1">
                          Sosialisasi Akreditasi Program Studi Internasional
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Perlu revisi komponen honor panitia pengarah
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md whitespace-nowrap">
                      <span className="font-medium text-on-surface">LP3M</span>
                      <span className="block text-on-surface-variant text-[11px]">Akun: 521219</span>
                    </td>
                    <td className="py-space-md px-space-md text-right whitespace-nowrap font-currency-cell text-currency-cell text-on-surface tabular-nums">
                      Rp 18.200.000
                    </td>
                    <td className="py-space-md px-space-md whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-secondary font-semibold text-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          Draft Revisi Anggaran
                        </span>
                        <span className="text-on-surface-variant text-[11px]">Dikembalikan oleh Verifikator</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-space-xs">
                        <Link
                          href="/kegiatan/buat"
                          className="px-space-md py-1 bg-secondary-container text-on-secondary-fixed rounded font-label-sm text-label-sm hover:bg-secondary-fixed transition-all"
                        >
                          Lengkapi
                        </Link>
                        <button
                          type="button"
                          className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-all"
                          title="Lihat Catatan Revisi"
                        >
                          <Icon name="comment" className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Item 3 */}
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-primary">KGT-2025-084</span>
                        <span className="font-body-md text-body-md font-semibold text-on-surface line-clamp-1">
                          Rapat Koordinasi Penyusunan Renstra 2026
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Honor Tim Penyusun Pokja Rektorat (12 Orang)
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md whitespace-nowrap">
                      <span className="font-medium text-on-surface">Bagian Perencanaan</span>
                      <span className="block text-on-surface-variant text-[11px]">Akun: 521213</span>
                    </td>
                    <td className="py-space-md px-space-md text-right whitespace-nowrap font-currency-cell text-currency-cell text-on-surface tabular-nums">
                      Rp 32.750.000
                    </td>
                    <td className="py-space-md px-space-md whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-primary font-semibold text-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Verifikasi Pajak &amp; Golongan
                        </span>
                        <span className="text-on-surface-variant text-[11px]">PPh 21 Gol. III / IV match</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-space-xs">
                        <Link
                          href="/kegiatan/approval"
                          className="px-space-md py-1 bg-surface-container-high text-on-surface rounded font-label-sm text-label-sm hover:bg-surface-container-highest transition-all"
                        >
                          Verifikasi
                        </Link>
                        <button
                          type="button"
                          className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-all"
                          title="Detail Lampiran SPTJB"
                        >
                          <Icon name="attach_file" className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Widget: Kegiatan Terbaru */}
          <section className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-space-lg flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Daftar Kegiatan Terbaru
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Riwayat pengajuan honorarium dan status pencairan Satker Pusat
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center p-1 bg-surface-container rounded-lg font-label-sm text-label-sm">
                <button
                  type="button"
                  className="px-space-md py-1 bg-surface-container-lowest text-primary font-semibold rounded shadow-xs"
                >
                  Semua (68)
                </button>
                <button
                  type="button"
                  className="px-space-md py-1 text-on-surface-variant hover:text-on-surface rounded transition-colors"
                >
                  Berjalan (12)
                </button>
                <button
                  type="button"
                  className="px-space-md py-1 text-on-surface-variant hover:text-on-surface rounded transition-colors"
                >
                  Menunggu Bayar (5)
                </button>
              </div>
            </div>

            {/* Recent Rows List */}
            <div className="flex flex-col gap-space-xs">
              {/* Row Item 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md bg-surface rounded-lg hover:bg-surface-container-low transition-all gap-space-sm border border-outline-variant/20">
                <div className="flex items-start gap-space-md">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <Icon name="school" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="font-mono text-label-sm text-on-surface-variant font-bold">
                        KGT-2025-095
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">
                        Ujian Masuk Program Pascasarjana Gelombang I
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Biro Administrasi Akademik • Penguji: 18 Dosen • DIPA PNBP
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-space-lg shrink-0">
                  <div className="text-right">
                    <span className="font-currency-cell text-currency-cell text-on-surface tabular-nums">
                      Rp 45.900.000
                    </span>
                    <span className="block text-[11px] text-on-surface-variant">Diajukan: 24 Mar 2025</span>
                  </div>
                  <span className="px-space-sm py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Processing TU
                  </span>
                </div>
              </div>

              {/* Row Item 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md bg-surface rounded-lg hover:bg-surface-container-low transition-all gap-space-sm border border-outline-variant/20">
                <div className="flex items-start gap-space-md">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary shrink-0">
                    <Icon name="verified" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="font-mono text-label-sm text-on-surface-variant font-bold">
                        KGT-2025-081
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">
                        Reviewer Hibah Penelitian Fundamental 2025
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      LPPM • 14 Penilai Eksternal &amp; Internal • BOPTN Riset
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-space-lg shrink-0">
                  <div className="text-right">
                    <span className="font-currency-cell text-currency-cell text-on-surface tabular-nums">
                      Rp 28.000.000
                    </span>
                    <span className="block text-[11px] text-tertiary font-medium">SP2D: #98213/2025</span>
                  </div>
                  <span className="px-space-sm py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    Paid / SPJ Sah
                  </span>
                </div>
              </div>

              {/* Row Item 3 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-md bg-surface rounded-lg hover:bg-surface-container-low transition-all gap-space-sm border border-outline-variant/20">
                <div className="flex items-start gap-space-md">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                    <Icon name="gavel" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      <span className="font-mono text-label-sm text-on-surface-variant font-bold">
                        KGT-2025-078
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">
                        Pengadaan Barang Jasa Pokja Unit Layanan Pengadaan
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Biro Umum &amp; BMN • Honor Pejabat Pengadaan (4 Pokja)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-space-lg shrink-0">
                  <div className="text-right">
                    <span className="font-currency-cell text-currency-cell text-on-surface tabular-nums">
                      Rp 16.400.000
                    </span>
                    <span className="block text-[11px] text-on-surface-variant">SK Rektor No. 441/UN/2025</span>
                  </div>
                  <span className="px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                    Approved PPK
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Link */}
            <div className="pt-space-xs text-center">
              <Link
                href="/honor"
                className="inline-flex items-center gap-space-xs font-label-md text-label-md text-primary hover:underline font-semibold"
              >
                <span>Lihat Semua 68 Kegiatan di Register SPJ</span>
                <Icon name="arrow_forward" className="text-sm" />
              </Link>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-xl">
          {/* Widget: Budget Utilization */}
          <section className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Penyerapan Anggaran Honor
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Pagu DIPA 2025</h2>
              </div>
              <span className="px-space-sm py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                Aman (Kuota Q1)
              </span>
            </div>

            {/* Visual Ring/Metric summary */}
            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-space-lg">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-highest"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="68.4, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-headline-sm text-headline-sm text-primary font-bold">
                  68.4%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Realisasi s.d Triwulan I
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface tabular-nums">
                  Rp 820.800.000
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  dari Pagu Rp 1.200.000.000
                </span>
              </div>
            </div>

            {/* Progress Bars by Unit Kerja */}
            <div className="flex flex-col gap-space-sm pt-space-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Penyerapan per Satuan Kerja
              </span>

              {/* LPPM (82%) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface font-medium">LPPM (Riset &amp; PKM)</span>
                  <span className="tabular-nums font-semibold text-primary">82%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              {/* Biro Umum (78%) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface font-medium">Biro Umum &amp; Kepegawaian</span>
                  <span className="tabular-nums font-semibold text-primary">78%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>

              {/* Biro Keuangan (64%) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface font-medium">Biro Keuangan &amp; Akuntansi</span>
                  <span className="tabular-nums font-semibold text-primary">64%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-primary-container h-2 rounded-full" style={{ width: '64%' }} />
                </div>
              </div>

              {/* Fakultas Vokasi (55%) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-on-surface font-medium">Fakultas Vokasi</span>
                  <span className="tabular-nums font-semibold text-secondary">55%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-secondary h-2 rounded-full" style={{ width: '55%' }} />
                </div>
              </div>
            </div>
          </section>

          {/* Widget: Tren Realisasi Pengeluaran */}
          <section className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Tren Realisasi
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Pengeluaran Honor 2025
                </h2>
              </div>
              <span className="font-mono text-label-sm text-label-sm text-on-surface-variant">
                Juta Rupiah
              </span>
            </div>

            {/* Custom Bar Visualization */}
            <div className="pt-space-md pb-space-xs flex items-end justify-between gap-space-sm h-40">
              {/* Jan */}
              <div className="flex-1 flex flex-col items-center gap-space-xs group relative h-full justify-end">
                <div className="absolute -top-6 px-1.5 py-0.5 rounded bg-inverse-surface text-inverse-on-surface text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xs">
                  Rp 120.0 Jt
                </div>
                <div className="w-full bg-primary/40 rounded-t group-hover:bg-primary transition-colors" style={{ height: '60%' }} />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Jan</span>
              </div>

              {/* Feb */}
              <div className="flex-1 flex flex-col items-center gap-space-xs group relative h-full justify-end">
                <div className="absolute -top-6 px-1.5 py-0.5 rounded bg-inverse-surface text-inverse-on-surface text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xs">
                  Rp 155.2 Jt
                </div>
                <div className="w-full bg-primary/50 rounded-t group-hover:bg-primary transition-colors" style={{ height: '75%' }} />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Feb</span>
              </div>

              {/* Mar */}
              <div className="flex-1 flex flex-col items-center gap-space-xs group relative h-full justify-end">
                <div className="absolute -top-6 px-1.5 py-0.5 rounded bg-inverse-surface text-inverse-on-surface text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xs">
                  Rp 184.6 Jt
                </div>
                <div className="w-full bg-primary rounded-t shadow-xs" style={{ height: '90%' }} />
                <span className="font-label-sm text-label-sm text-primary font-bold">Mar</span>
              </div>

              {/* Apr */}
              <div className="flex-1 flex flex-col items-center gap-space-xs group relative h-full justify-end">
                <div className="absolute -top-6 px-1.5 py-0.5 rounded bg-inverse-surface text-inverse-on-surface text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xs">
                  Rp 95.0 Jt (Est)
                </div>
                <div className="w-full bg-surface-container-high rounded-t border-t-2 border-dashed border-outline-variant" style={{ height: '45%' }} />
                <span className="font-label-sm text-label-sm text-outline">Apr</span>
              </div>

              {/* Mei */}
              <div className="flex-1 flex flex-col items-center gap-space-xs group relative h-full justify-end">
                <div className="absolute -top-6 px-1.5 py-0.5 rounded bg-inverse-surface text-inverse-on-surface text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xs">
                  Rp 130.0 Jt (Est)
                </div>
                <div className="w-full bg-surface-container-high rounded-t border-t-2 border-dashed border-outline-variant" style={{ height: '65%' }} />
                <span className="font-label-sm text-label-sm text-outline">Mei</span>
              </div>

              {/* Jun */}
              <div className="flex-1 flex flex-col items-center gap-space-xs group relative h-full justify-end">
                <div className="absolute -top-6 px-1.5 py-0.5 rounded bg-inverse-surface text-inverse-on-surface text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xs">
                  Rp 160.0 Jt (Est)
                </div>
                <div className="w-full bg-surface-container-high rounded-t border-t-2 border-dashed border-outline-variant" style={{ height: '80%' }} />
                <span className="font-label-sm text-label-sm text-outline">Jun</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
