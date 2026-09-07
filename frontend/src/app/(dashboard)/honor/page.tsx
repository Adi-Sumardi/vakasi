'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { toast } from 'sonner';

interface HonorRow {
  id: string;
  code: string;
  title: string;
  date: string;
  sk: string;
  role: string;
  volume: string;
  rate: number;
  gross: number;
  tax: number;
  net: number;
  sp2dNumber: string;
  status: 'Paid' | 'Processing' | 'Approved';
}

const HONOR_ROWS: HonorRow[] = [
  {
    id: '1',
    code: 'KGT-2025-089',
    title: 'Workshop Evaluasi Kurikulum MBKM Mandiri',
    date: '24 - 25 Mar 2025',
    sk: '114/UN.7/KU/2025',
    role: 'Narasumber Utama',
    volume: '4 Jam',
    rate: 1400000,
    gross: 5600000,
    tax: 840000,
    net: 4760000,
    sp2dNumber: 'SP2D-2025-09821',
    status: 'Paid',
  },
  {
    id: '2',
    code: 'KGT-2025-072',
    title: 'Sidang Ujian Terbuka Disertasi Pascasarjana',
    date: '12 Mar 2025',
    sk: '089/UN.7/KU/2025',
    role: 'Penguji Luar',
    volume: '3 Mahasiswa',
    rate: 1500000,
    gross: 4500000,
    tax: 675000,
    net: 3825000,
    sp2dNumber: 'SP2D-2025-09140',
    status: 'Paid',
  },
  {
    id: '3',
    code: 'KGT-2025-061',
    title: 'Review Proposal Hibah Penelitian DIPA Riset',
    date: '27 Feb 2025',
    sk: '062/UN.7/KU/2025',
    role: 'Reviewer Internal',
    volume: '8 Proposal',
    rate: 500000,
    gross: 4000000,
    tax: 600000,
    net: 3400000,
    sp2dNumber: 'SP2D-2025-08102',
    status: 'Paid',
  },
  {
    id: '4',
    code: 'KGT-2025-055',
    title: 'Penyusunan Pedoman Akreditasi LAM-PT',
    date: '15 Feb 2025',
    sk: '048/UN.7/KU/2025',
    role: 'Narasumber Ahli',
    volume: '5 Jam',
    rate: 1400000,
    gross: 7000000,
    tax: 1050000,
    net: 5950000,
    sp2dNumber: 'SP2D-2025-07921',
    status: 'Paid',
  },
  {
    id: '5',
    code: 'KGT-2025-032',
    title: 'Pelatihan Metodologi Riset Guru Besar',
    date: '22 Jan 2025',
    sk: '021/UN.7/KU/2025',
    role: 'Instruktur Utama',
    volume: '6 Jam',
    rate: 1400000,
    gross: 8400000,
    tax: 1260000,
    net: 7140000,
    sp2dNumber: 'SP2D-2025-06401',
    status: 'Paid',
  },
  {
    id: '6',
    code: 'KGT-2025-018',
    title: 'Sosialisasi Program Pembinaan Talenta Peneliti Muda',
    date: '10 Jan 2025',
    sk: '011/UN.7/KU/2025',
    role: 'Narasumber Tamu',
    volume: '3 Jam',
    rate: 1400000,
    gross: 4700000,
    tax: 705000,
    net: 3995000,
    sp2dNumber: 'SP2D-2025-05990',
    status: 'Paid',
  },
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DetailRekapSlipHonorPage() {
  const [selectedRowForSlip, setSelectedRowForSlip] = useState<HonorRow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRows = HONOR_ROWS.filter(
    (r) =>
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between pb-space-xs flex-wrap gap-2">
        <div className="flex items-center gap-space-xs font-label-md text-label-md text-secondary">
          <span className="hover:text-primary cursor-pointer transition-colors">Honorarium</span>
          <Icon name="chevron_right" className="text-[0.875rem] text-outline" />
          <span className="hover:text-primary cursor-pointer transition-colors">Rekap Honor Pegawai</span>
          <Icon name="chevron_right" className="text-[0.875rem] text-outline" />
          <span className="font-semibold text-primary">Prof. Dr. Hendra Gunawan, M.Sc</span>
        </div>
        <div className="flex items-center gap-space-xs">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="font-label-sm text-label-sm text-tertiary font-semibold tracking-wide uppercase">
            Sinkronisasi SAKTI: Terkini (Hari Ini, 09:41 WIB)
          </span>
        </div>
      </div>

      {/* Employee Profile Header Card */}
      <section className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-space-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-primary/5 via-primary/[0.01] to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-xl relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-lg">
            <div className="relative">
              <img
                className="w-20 h-20 rounded-xl object-cover shadow-xs border border-outline-variant/30"
                alt="Prof. Dr. Hendra Gunawan, M.Sc"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa_UVU4vZdTMx02iHRTxOyYU5JXD8JXwKWWMMAUfeFfMe50QnbVDC1QKxGCEsxN4qZTGTVRdNYzm4kgG0T56GpS-gaY7BkzdM6EcRy6Qwv9Hq3w2y8ZgoUxWnBuz-rrOtiTrxBiMlDKMYetGfWM6z35sipMHbzKXRXF94m8MgQAPL2T-zjH9zVDP47IEehp5DxFYGRRshN7NQg950L8YND5Xbz-y_2lb7SUrCRIu7gPH1cL6cBL-km7Q"
              />
              <span
                className="absolute -bottom-1 -right-1 p-1 bg-tertiary text-on-tertiary rounded-full shadow-xs flex items-center justify-center"
                title="Akun Terverifikasi Pangkalan Data"
              >
                <Icon name="verified" className="text-[0.875rem]" />
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-space-sm">
                <h1 className="font-headline-md text-headline-md text-on-surface">
                  Prof. Dr. Hendra Gunawan, M.Sc
                </h1>
                <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Gol. IV/c - Pembina Utama Muda
                </span>
                <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                  Tarif PPh 21 Final: 15%
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-space-lg mt-space-xs font-body-sm text-body-sm text-secondary">
                <div className="flex items-center gap-1">
                  <Icon name="badge" className="text-[1rem] text-outline" />
                  <span>NIP: <span className="text-on-surface font-mono font-semibold">196504121990031002</span></span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="school" className="text-[1rem] text-outline" />
                  <span>Jabatan: <strong className="text-on-surface">Guru Besar / Dosen Tetap</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="domain" className="text-[1rem] text-outline" />
                  <span>Fakultas Matematika dan Ilmu Pengetahuan Alam</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-space-lg mt-space-xs font-body-sm text-body-sm text-secondary">
                <div className="flex items-center gap-1">
                  <Icon name="credit_card" className="text-[1rem] text-outline" />
                  <span>NPWP: <span className="text-on-surface font-mono font-semibold">08.234.912.4-401.000</span></span>
                  <span className="px-1.5 py-0.2 bg-tertiary/10 text-tertiary rounded text-[0.625rem] font-bold">
                    Valid DJP
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="account_balance" className="text-[1rem] text-outline" />
                  <span>Bank Mandiri: <span className="text-on-surface font-mono font-semibold">131-00-9842109-1</span></span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-tertiary/15 text-tertiary rounded text-[0.625rem] font-bold">
                    <span className="w-1 h-1 rounded-full bg-tertiary" /> BI-FAST Valid
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col xl:flex-row gap-space-xs">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-space-xs px-space-md py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-lg text-label-lg transition-colors border border-outline-variant/40 shadow-xs"
            >
              <Icon name="print" className="text-[1.125rem]" />
              <span>Cetak Rekap</span>
            </button>
            <button
              type="button"
              onClick={() => toast.info('Mengunduh formulir bukti potong 1721-A2...')}
              className="inline-flex items-center justify-center gap-space-xs px-space-md py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-lg text-label-lg transition-colors border border-outline-variant/40 shadow-xs"
            >
              <Icon name="download" className="text-[1.125rem]" />
              <span>Semua Bukti 1721-A2</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRowForSlip(HONOR_ROWS[0])}
              className="inline-flex items-center justify-center gap-space-xs px-space-md py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-lg text-label-lg transition-colors shadow-xs font-semibold"
            >
              <Icon name="send" className="text-[1.125rem]" />
              <span>Kirim Slip Digital</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Fiscal Summary KPI Panels */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
              Total Bruto TA 2025
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <Icon name="payments" className="text-[1.25rem]" />
            </div>
          </div>
          <div className="mt-space-md">
            <div className="font-currency-display text-currency-display text-on-surface tabular-nums">
              Rp 34.200.000
            </div>
            <div className="flex items-center gap-1.5 mt-space-2xs text-secondary font-body-sm text-body-sm">
              <span className="text-tertiary font-semibold flex items-center gap-0.5">
                <Icon name="trending_up" className="text-[0.875rem]" /> 100%
              </span>
              <span>Sesuai POK/SBM Kemenkeu</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-md overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
              Potongan PPh 21 (15%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-error-container/40 flex items-center justify-center text-error">
              <Icon name="receipt" className="text-[1.25rem]" />
            </div>
          </div>
          <div className="mt-space-md">
            <div className="font-currency-display text-currency-display text-error tabular-nums">
              -Rp 5.130.000
            </div>
            <div className="flex items-center gap-1.5 mt-space-2xs text-secondary font-body-sm text-body-sm">
              <span className="text-error font-semibold flex items-center gap-0.5">
                <Icon name="policy" className="text-[0.875rem]" /> Final
              </span>
              <span>Pasal 21 Ayat (1) b Gol IV</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-md overflow-hidden">
            <div className="bg-error h-full rounded-full" style={{ width: '15%' }} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
              Netto Diterima
            </span>
            <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
              <Icon name="account_balance_wallet" className="text-[1.25rem]" />
            </div>
          </div>
          <div className="mt-space-md">
            <div className="font-currency-display text-currency-display text-tertiary tabular-nums">
              Rp 29.070.000
            </div>
            <div className="flex items-center gap-1.5 mt-space-2xs text-secondary font-body-sm text-body-sm">
              <span className="text-tertiary font-semibold flex items-center gap-0.5">
                <Icon name="done_all" className="text-[0.875rem]" /> 85%
              </span>
              <span>Total realisasi ke rekening</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-md overflow-hidden">
            <div className="bg-tertiary h-full rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
              Jumlah Penugasan / SK
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <Icon name="folder_shared" className="text-[1.25rem]" />
            </div>
          </div>
          <div className="mt-space-md">
            <div className="font-currency-display text-currency-display text-on-surface tabular-nums">
              6 Kegiatan
            </div>
            <div className="flex items-center gap-1.5 mt-space-2xs text-secondary font-body-sm text-body-sm">
              <span className="text-primary font-semibold">100% Selesai SPJ</span>
              <span>TA 2025</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-md overflow-hidden">
            <div className="bg-secondary h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </section>

      {/* Line Items Table & Search Controls */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="p-space-base bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-md border-b border-outline-variant/30">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Rincian Riwayat Honorarium Pegawai
            </h2>
            <p className="text-xs text-on-surface-variant">Daftar transaksi dan penerbitan slip honorarium digital</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Icon name="search" className="absolute left-3 top-2.5 text-outline text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan atau nomor SK..."
              className="w-full h-9 pl-9 pr-3 text-body-sm bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-body-sm text-body-sm border-collapse">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
              <tr>
                <th className="px-space-base py-space-sm font-bold">Nomor &amp; Nama Kegiatan</th>
                <th className="px-space-base py-space-sm font-bold">Peran Penugasan</th>
                <th className="px-space-base py-space-sm font-bold">Waktu &amp; Tanggal</th>
                <th className="px-space-base py-space-sm font-bold text-center">Volume</th>
                <th className="px-space-base py-space-sm font-bold text-right">Tarif Satuan</th>
                <th className="px-space-base py-space-sm font-bold text-right">Bruto</th>
                <th className="px-space-base py-space-sm font-bold text-right">PPh 21</th>
                <th className="px-space-base py-space-sm font-bold text-right">Netto</th>
                <th className="px-space-base py-space-sm font-bold text-center">Status SP2D</th>
                <th className="px-space-base py-space-sm font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-space-base py-space-sm">
                    <div className="font-label-lg text-label-lg font-semibold text-primary">{row.code}</div>
                    <div className="font-body-sm text-body-sm text-on-surface font-medium">{row.title}</div>
                    <div className="font-label-sm text-label-sm text-outline mt-0.5 font-mono">
                      SK: {row.sk}
                    </div>
                  </td>
                  <td className="px-space-base py-space-sm">
                    <span className="px-space-xs py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-medium">
                      {row.role}
                    </span>
                  </td>
                  <td className="px-space-base py-space-sm text-on-surface-variant">{row.date}</td>
                  <td className="px-space-base py-space-sm text-center font-mono font-semibold">{row.volume}</td>
                  <td className="px-space-base py-space-sm text-right font-mono tabular-nums">
                    {formatRupiah(row.rate)}
                  </td>
                  <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell tabular-nums">
                    {formatRupiah(row.gross)}
                  </td>
                  <td className="px-space-base py-space-sm text-right text-error font-mono tabular-nums">
                    -{formatRupiah(row.tax)}
                  </td>
                  <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell text-tertiary font-bold tabular-nums">
                    {formatRupiah(row.net)}
                  </td>
                  <td className="px-space-base py-space-sm text-center">
                    <div className="flex flex-col items-center">
                      <span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-label-sm text-label-sm font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Sah
                      </span>
                      <span className="text-[10px] text-outline font-mono mt-0.5">{row.sp2dNumber}</span>
                    </div>
                  </td>
                  <td className="px-space-base py-space-sm text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedRowForSlip(row)}
                      className="px-3 py-1 rounded bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold shadow-xs flex items-center gap-1 mx-auto"
                    >
                      <Icon name="description" className="text-sm" />
                      <span>Lihat Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Slip Modal Preview */}
      {selectedRowForSlip && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-xl max-w-2xl w-full p-space-2xl border border-outline-variant/40 shadow-2xl my-8">
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-lg print:hidden">
              <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                <Icon name="verified" className="text-base" /> Preview Dokumen Sah
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 border border-outline-variant/40"
                >
                  <Icon name="print" className="text-sm" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRowForSlip(null)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>

            {/* Official Slip Document */}
            <div className="border-2 border-outline-variant/50 p-space-xl rounded-xl bg-white text-slate-900 font-serif">
              {/* Kop Surat */}
              <div className="text-center pb-4 border-b-2 border-slate-900 mb-4">
                <div className="font-bold text-xs uppercase tracking-widest text-slate-700">
                  KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
                </div>
                <div className="font-bold text-sm uppercase text-slate-900">
                  SATUAN PENDIDIKAN &amp; BIRO ADMINISTRASI KEUANGAN
                </div>
                <div className="text-[11px] text-slate-600 font-sans">
                  Jl. Jenderal Sudirman Pintu Satu Senayan, Jakarta Pusat 10270 • Laman: kemdikbud.go.id
                </div>
              </div>

              {/* Title */}
              <div className="text-center my-3">
                <div className="font-bold text-sm tracking-wide uppercase font-sans">
                  SLIP BUKTI PEMBAYARAN HONORARIUM &amp; POTONGAN PPh 21
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  No. Bukti: SLP/2025/{selectedRowForSlip.code}/001
                </div>
              </div>

              {/* Identity Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs font-sans p-3 bg-slate-50 rounded-lg mb-4">
                <div>
                  <span className="text-slate-500 block">Nama Pegawai / Penerima:</span>
                  <strong className="text-slate-900">Prof. Dr. Hendra Gunawan, M.Sc</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">NIP:</span>
                  <span className="font-mono text-slate-900">196504121990031002</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pangkat / Golongan:</span>
                  <span className="text-slate-900 font-semibold">Pembina Utama Muda (Gol IV/c)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Rekening Bank Tujuan:</span>
                  <span className="text-slate-900 font-mono">Bank Mandiri - 131-00-9842109-1</span>
                </div>
              </div>

              {/* Financial Computation Table */}
              <table className="w-full text-xs font-sans border-collapse mb-4">
                <thead>
                  <tr className="border-y border-slate-300 bg-slate-100 font-bold">
                    <th className="py-1.5 px-2 text-left">Uraian Komponen Honor</th>
                    <th className="py-1.5 px-2 text-center">Volume</th>
                    <th className="py-1.5 px-2 text-right">Tarif Satuan</th>
                    <th className="py-1.5 px-2 text-right">Jumlah Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-2 px-2">
                      <div className="font-semibold">{selectedRowForSlip.title}</div>
                      <div className="text-[11px] text-slate-500">Peran: {selectedRowForSlip.role} • SK: {selectedRowForSlip.sk}</div>
                    </td>
                    <td className="py-2 px-2 text-center font-mono">{selectedRowForSlip.volume}</td>
                    <td className="py-2 px-2 text-right font-mono">{formatRupiah(selectedRowForSlip.rate)}</td>
                    <td className="py-2 px-2 text-right font-mono font-semibold">{formatRupiah(selectedRowForSlip.gross)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-semibold">
                    <td colSpan={3} className="py-1.5 px-2 text-right">Potongan PPh 21 Final (15%):</td>
                    <td className="py-1.5 px-2 text-right text-red-600 font-mono">-{formatRupiah(selectedRowForSlip.tax)}</td>
                  </tr>
                  <tr className="bg-blue-50 font-bold text-slate-900 border-t-2 border-slate-400">
                    <td colSpan={3} className="py-2 px-2 text-right uppercase">Jumlah Bersih Diterima (Netto):</td>
                    <td className="py-2 px-2 text-right text-blue-900 font-mono text-sm">{formatRupiah(selectedRowForSlip.net)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Terbilang */}
              <div className="p-2.5 rounded bg-slate-100 font-sans text-xs mb-6 italic text-slate-700">
                Terbilang: <strong>&ldquo;Empat Juta Tujuh Ratus Enam Puluh Ribu Rupiah&rdquo;</strong>
              </div>

              {/* Digital Signatures & QR Code */}
              <div className="grid grid-cols-2 gap-4 text-center font-sans text-xs">
                <div className="flex flex-col items-center">
                  <span className="text-slate-600">Pejabat Pembuat Komitmen (PPK),</span>
                  <div className="my-2 p-1.5 border border-slate-300 rounded bg-slate-50 flex items-center gap-1.5">
                    <Icon name="qr_code_2" className="text-3xl text-slate-800" />
                    <span className="text-[9px] text-slate-500 text-left font-mono">
                      TERVERIFIKASI DIGITAL<br />ID: PPK-092-MULYADI
                    </span>
                  </div>
                  <strong className="underline text-slate-900">Dr. H. Mulyadi, M.Pd</strong>
                  <span className="text-slate-500 font-mono">NIP. 196803121992031003</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-slate-600">Bendahara Pengeluaran,</span>
                  <div className="my-2 p-1.5 border border-slate-300 rounded bg-slate-50 flex items-center gap-1.5">
                    <Icon name="qr_code_2" className="text-3xl text-slate-800" />
                    <span className="text-[9px] text-slate-500 text-left font-mono">
                      TERVERIFIKASI DIGITAL<br />ID: BND-044-NURHALIZA
                    </span>
                  </div>
                  <strong className="underline text-slate-900">Siti Nurhaliza, S.AP</strong>
                  <span className="text-slate-500 font-mono">NIP. 199204182018012001</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
