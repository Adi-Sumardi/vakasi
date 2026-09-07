'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DisbursementItem {
  id: string;
  code: string;
  title: string;
  sk: string;
  mak: string;
  unit: string;
  subUnit: string;
  recipientCount: number;
  gross: number;
  tax: number;
  net: number;
  approvalStatus: 'Approved' | 'Pending' | 'Rejected';
  paymentStatus: 'Ready to Pay' | 'Processing' | 'Paid';
}

const INITIAL_ITEMS: DisbursementItem[] = [
  {
    id: '1',
    code: 'KGT-2025-089',
    title: 'Workshop Evaluasi Kurikulum MBKM Mandiri',
    sk: '114/UN.7/KU/2025',
    mak: '525112',
    unit: 'Fakultas Sains & Tek.',
    subUnit: 'Subbag Akademik',
    recipientCount: 8,
    gross: 30500000,
    tax: 1650000,
    net: 28850000,
    approvalStatus: 'Approved',
    paymentStatus: 'Ready to Pay',
  },
  {
    id: '2',
    code: 'KGT-2025-091',
    title: 'Seminar Internasional Ketahanan Energi Terbarukan',
    sk: '119/UN.7/KU/2025',
    mak: '525119',
    unit: 'LPPM',
    subUnit: 'Pusat Riset Energi',
    recipientCount: 12,
    gross: 45000000,
    tax: 2450000,
    net: 42550000,
    approvalStatus: 'Approved',
    paymentStatus: 'Ready to Pay',
  },
  {
    id: '3',
    code: 'KGT-2025-076',
    title: 'Pelatihan Penyusunan Soal HOTS Guru Matematika',
    sk: '098/UN.7/KU/2025',
    mak: '525112',
    unit: 'Fakultas Keguruan',
    subUnit: 'Laboratorium Microteaching',
    recipientCount: 6,
    gross: 15000000,
    tax: 750000,
    net: 14250000,
    approvalStatus: 'Approved',
    paymentStatus: 'Paid',
  },
  {
    id: '4',
    code: 'KGT-2025-083',
    title: 'Review Kurikulum Vokasi D-IV Rekayasa Perangkat Lunak',
    sk: '105/UN.7/KU/2025',
    mak: '525114',
    unit: 'Sekolah Vokasi',
    subUnit: 'Prodi Informatika',
    recipientCount: 5,
    gross: 12800000,
    tax: 640000,
    net: 12160000,
    approvalStatus: 'Approved',
    paymentStatus: 'Processing',
  },
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function KeuanganPembayaranPage() {
  const [items, setItems] = useState<DisbursementItem[]>(INITIAL_ITEMS);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ready' | 'processing' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForPayment, setSelectedItemForPayment] = useState<DisbursementItem | null>(null);

  // Drawer form state
  const [paymentMethod, setPaymentMethod] = useState('cms_mandiri');
  const [refNumber, setRefNumber] = useState('SP2D-2025-03910');
  const [proofFileName, setProofFileName] = useState<string | null>('Bukti_Transfer_CMS_Mandiri_Batch89.pdf');

  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'ready' && item.paymentStatus !== 'Ready to Pay') return false;
    if (selectedFilter === 'processing' && item.paymentStatus !== 'Processing') return false;
    if (selectedFilter === 'paid' && item.paymentStatus !== 'Paid') return false;
    if (
      searchQuery &&
      !item.code.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  function handleExecutePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemForPayment) return;

    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedItemForPayment.id ? { ...it, paymentStatus: 'Paid' } : it
      )
    );
    toast.success(
      `Pembayaran kegiatan ${selectedItemForPayment.code} sebesar ${formatRupiah(
        selectedItemForPayment.net
      )} berhasil dibukukan!`
    );
    setSelectedItemForPayment(null);
  }

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-xl">
      {/* Top Ambient Banner & Executive Action Bar */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-xs p-space-xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 w-64 h-64 bg-tertiary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-space-lg">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="px-space-sm py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm tracking-wider uppercase font-semibold">
                Fiskal TA 2025
              </span>
              <span className="text-on-surface-variant font-label-sm text-label-sm font-medium">
                • Satker 412981 / BPK
              </span>
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-tertiary font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Host-to-Host Online
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Disbursement &amp; Pembayaran Honorarium
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Kelola batch transfer perbankan, validasi rekening, dan unggah bukti transfer SP2D / CMS Bank secara terintegrasi dengan kepatuhan perpajakan instansi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm self-start xl:self-auto">
            <button
              type="button"
              onClick={() => toast.success('Mengekspor data payroll CMS Excel...')}
              className="h-10 px-space-base rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/40 shadow-xs flex items-center gap-space-xs font-label-lg text-label-lg transition-all font-semibold"
            >
              <Icon name="download" className="text-primary text-base" />
              <span>Ekspor SPK / Payroll Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedItemForPayment(items[0])}
              className="h-10 px-space-base rounded-lg bg-primary text-on-primary hover:bg-primary-container shadow-xs flex items-center gap-space-xs font-label-lg text-label-lg transition-all font-semibold"
            >
              <Icon name="add_card" className="text-base" />
              <span>+ Buat Batch Pembayaran Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Metric 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Total Pengajuan
              </span>
              <div className="font-currency-display text-currency-display text-on-surface mt-space-2xs tabular-nums">
                Rp 412.800.000
              </div>
            </div>
            <span className="p-space-sm bg-surface-container rounded-lg text-secondary">
              <Icon name="receipt_long" />
            </span>
          </div>
          <div className="mt-space-md flex items-center justify-between font-body-sm text-body-sm pt-space-xs border-t border-outline-variant/20">
            <span className="text-on-surface-variant font-medium">Volume Kumulatif</span>
            <span className="px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
              24 Kegiatan
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider font-semibold">
                Total Approved
              </span>
              <div className="font-currency-display text-currency-display text-on-surface mt-space-2xs tabular-nums">
                Rp 324.500.000
              </div>
            </div>
            <span className="p-space-sm bg-tertiary-container/10 rounded-lg text-tertiary">
              <Icon name="verified" />
            </span>
          </div>
          <div className="mt-space-md flex items-center justify-between font-body-sm text-body-sm pt-space-xs border-t border-outline-variant/20">
            <span className="text-on-surface-variant font-medium">Siap verifikasi pencairan</span>
            <span className="px-space-sm py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
              18 Kegiatan siap bayar
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">
                Total Pending Payment
              </span>
              <div className="font-currency-display text-currency-display text-primary mt-space-2xs tabular-nums">
                Rp 88.300.000
              </div>
            </div>
            <span className="p-space-sm bg-primary-fixed/40 rounded-lg text-primary">
              <Icon name="pending_actions" />
            </span>
          </div>
          <div className="mt-space-md flex items-center justify-between font-body-sm text-body-sm pt-space-xs border-t border-outline-variant/20">
            <span className="text-on-surface-variant font-medium">Antrean aktif</span>
            <span className="px-space-sm py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
              5 Batch siap eksekusi
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Total Paid
              </span>
              <div className="font-currency-display text-currency-display text-on-surface mt-space-2xs tabular-nums">
                Rp 236.200.000
              </div>
            </div>
            <span className="p-space-sm bg-surface-container-high rounded-lg text-on-surface">
              <Icon name="task_alt" />
            </span>
          </div>
          <div className="mt-space-md flex items-center justify-between font-body-sm text-body-sm pt-space-xs border-t border-outline-variant/20">
            <span className="text-on-surface-variant font-medium">Rekonsiliasi BKU Beres</span>
            <span className="px-space-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
              13 Kegiatan selesai transfer
            </span>
          </div>
        </div>
      </div>

      {/* Main Workstation Canvas */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden flex flex-col">
        {/* Table Controls & Tabs Filter */}
        <div className="p-space-base bg-surface-container-low flex flex-col lg:flex-row lg:items-center justify-between gap-space-md border-b border-outline-variant/30">
          {/* Semantic Filter Pills */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={cn(
                'px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 whitespace-nowrap',
                selectedFilter === 'all'
                  ? 'bg-primary text-on-primary shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              )}
            >
              <span>Semua Antrean</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-mono text-[11px]">
                {items.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('ready')}
              className={cn(
                'px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 whitespace-nowrap',
                selectedFilter === 'ready'
                  ? 'bg-primary text-on-primary shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Siap Bayar (Approved)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-on-primary-fixed-variant text-inverse-on-surface font-mono text-[11px]">
                {items.filter((it) => it.paymentStatus === 'Ready to Pay').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('processing')}
              className={cn(
                'px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 whitespace-nowrap',
                selectedFilter === 'processing'
                  ? 'bg-primary text-on-primary shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              )}
            >
              <span>Dalam Proses Transfer</span>
              <span className="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container font-mono text-[11px]">
                {items.filter((it) => it.paymentStatus === 'Processing').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('paid')}
              className={cn(
                'px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 whitespace-nowrap',
                selectedFilter === 'paid'
                  ? 'bg-primary text-on-primary shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container'
              )}
            >
              <span>Selesai Dibayar (Paid)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface font-mono text-[11px]">
                {items.filter((it) => it.paymentStatus === 'Paid').length}
              </span>
            </button>
          </div>

          {/* Search & Rapid Tools */}
          <div className="flex items-center gap-space-sm">
            <div className="relative flex-1 sm:w-64">
              <Icon name="filter_list" className="absolute left-space-sm top-2 text-outline text-base" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter kegiatan atau nomor..."
                className="w-full h-8 pl-8 pr-3 text-body-sm font-body-sm bg-surface-container-lowest border border-outline-variant/40 rounded-md text-on-surface placeholder:text-outline focus:outline-none shadow-xs"
              />
            </div>
            <button
              type="button"
              className="h-8 px-space-sm bg-surface-container-lowest border border-outline-variant/40 text-on-surface hover:bg-surface-container rounded-md font-label-sm text-label-sm flex items-center gap-1 shadow-xs"
            >
              <Icon name="calendar_today" className="text-sm" />
              <span>Maret 2025</span>
            </button>
          </div>
        </div>

        {/* Main Table Component */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-body-sm text-body-sm border-collapse">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
              <tr>
                <th className="w-12 px-space-base py-space-sm text-center">
                  <input type="checkbox" className="rounded w-4 h-4 text-primary accent-primary cursor-pointer" />
                </th>
                <th className="px-space-base py-space-sm">Nomor Kegiatan &amp; Nama</th>
                <th className="px-space-base py-space-sm">Unit Pengusul</th>
                <th className="px-space-base py-space-sm text-center">Penerima</th>
                <th className="px-space-base py-space-sm text-right">Nominal Bruto</th>
                <th className="px-space-base py-space-sm text-right">Potongan PPh</th>
                <th className="px-space-base py-space-sm text-right">Nominal Netto (Transfer)</th>
                <th className="px-space-base py-space-sm text-center">Status Approval</th>
                <th className="px-space-base py-space-sm text-center">Status Pembayaran</th>
                <th className="px-space-base py-space-sm text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filteredItems.map((item) => (
                <tr key={item.id} className="bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-space-base py-space-sm text-center">
                    <input type="checkbox" className="rounded w-4 h-4 text-primary accent-primary cursor-pointer" />
                  </td>
                  <td className="px-space-base py-space-sm">
                    <div className="font-label-lg text-label-lg font-semibold text-primary">{item.code}</div>
                    <div className="font-body-sm text-body-sm text-on-surface font-medium line-clamp-1">{item.title}</div>
                    <div className="font-label-sm text-label-sm text-outline mt-0.5 flex items-center gap-1 font-mono">
                      <span>SK: {item.sk}</span> • <span>MAK: {item.mak}</span>
                    </div>
                  </td>
                  <td className="px-space-base py-space-sm">
                    <div className="font-body-md text-body-md text-on-surface">{item.unit}</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">{item.subUnit}</div>
                  </td>
                  <td className="px-space-base py-space-sm text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm font-semibold text-on-surface">
                      {item.recipientCount} Orang
                    </span>
                  </td>
                  <td className="px-space-base py-space-sm text-right font-mono text-body-md tabular-nums text-on-surface">
                    {formatRupiah(item.gross)}
                  </td>
                  <td className="px-space-base py-space-sm text-right font-mono text-body-md tabular-nums text-error">
                    -{formatRupiah(item.tax)}
                  </td>
                  <td className="px-space-base py-space-sm text-right font-mono font-currency-cell text-currency-cell tabular-nums text-primary font-bold">
                    {formatRupiah(item.net)}
                  </td>
                  <td className="px-space-base py-space-sm text-center">
                    <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                      {item.approvalStatus}
                    </span>
                  </td>
                  <td className="px-space-base py-space-sm text-center">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-semibold',
                        item.paymentStatus === 'Paid'
                          ? 'bg-tertiary-container/20 text-tertiary'
                          : item.paymentStatus === 'Processing'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-primary-fixed text-on-primary-fixed-variant'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          item.paymentStatus === 'Paid' ? 'bg-tertiary' : 'bg-primary'
                        )}
                      />
                      {item.paymentStatus}
                    </span>
                  </td>
                  <td className="px-space-base py-space-sm text-center">
                    <div className="flex items-center justify-center gap-1">
                      {item.paymentStatus === 'Ready to Pay' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedItemForPayment(item)}
                          className="h-8 px-space-sm rounded bg-primary text-on-primary hover:bg-primary-container font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1 shadow-xs"
                        >
                          <Icon name="payments" className="text-sm" />
                          <span>Bayar Sekarang</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedItemForPayment(item)}
                          className="h-8 px-space-sm rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1 border border-outline-variant/30"
                        >
                          <Icon name="receipt" className="text-sm" />
                          <span>Lihat SP2D</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Drawer / Modal */}
      {selectedItemForPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50 transition-opacity">
          <div className="bg-surface-container-lowest w-full max-w-lg h-full p-space-xl overflow-y-auto shadow-2xl flex flex-col justify-between border-l border-outline-variant/40">
            <div>
              <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-lg">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Eksekusi Pembayaran Honor
                  </h2>
                  <span className="font-mono text-label-sm text-primary font-semibold">
                    {selectedItemForPayment.code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItemForPayment(null)}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
                >
                  <Icon name="close" />
                </button>
              </div>

              {/* Activity Summary Box */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 mb-space-lg space-y-space-xs">
                <div className="font-label-md text-label-md font-semibold text-on-surface">
                  {selectedItemForPayment.title}
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  SK: {selectedItemForPayment.sk} • MAK: {selectedItemForPayment.mak}
                </div>
                <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                  <span className="text-xs text-outline">Jumlah Penerima:</span>
                  <span className="font-semibold text-xs text-on-surface">
                    {selectedItemForPayment.recipientCount} Pegawai Terdaftar
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-outline">Nominal Transfer Bersih (Netto):</span>
                  <span className="font-currency-display text-headline-sm text-primary font-bold">
                    {formatRupiah(selectedItemForPayment.net)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleExecutePayment} id="paymentForm" className="space-y-space-md font-body-sm text-body-sm">
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    Kanal / Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none"
                  >
                    <option value="cms_mandiri">CMS Bank Mandiri Corporate Portal</option>
                    <option value="cms_bri">CMS BRI Cash Management</option>
                    <option value="cms_bni">BNI Direct Host-to-Host</option>
                    <option value="kas_tunai">Kas Tunai Bendahara Satker</option>
                  </select>
                </div>

                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    Nomor Referensi Transaksi / SP2D
                  </label>
                  <input
                    type="text"
                    required
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="Contoh: SP2D-2025-03910 atau REF-MDR-992102"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-mono focus:bg-surface-container-lowest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    Unggah Bukti Transfer / Resi SP2D
                  </label>
                  <label
                    htmlFor="proof-upload"
                    className="p-4 border-2 border-dashed border-outline-variant/60 rounded-xl bg-surface-container-low text-center flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-surface-container transition-colors block"
                  >
                    <input
                      type="file"
                      id="proof-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setProofFileName(file.name);
                      }}
                    />
                    <Icon name="upload_file" className="text-3xl text-primary" />
                    <span className="font-label-md text-label-md text-on-surface font-medium">
                      {proofFileName || 'Klik untuk memilih berkas bukti bayar'}
                    </span>
                    <span className="text-xs text-outline">Format PDF atau JPG/PNG maks. 5 MB</span>
                  </label>
                </div>

                <div className="p-3 rounded-lg bg-surface-container flex items-center gap-2 text-xs text-on-surface-variant">
                  <Icon name="info" className="text-secondary text-base" />
                  <span>
                    Setelah eksekusi, dana akan tercatat cair di BKU dan slip honorarium siap diunduh oleh para penerima.
                  </span>
                </div>
              </form>
            </div>

            <div className="pt-space-md border-t border-outline-variant/30 flex items-center justify-end gap-space-sm">
              <button
                type="button"
                onClick={() => setSelectedItemForPayment(null)}
                className="px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md"
              >
                Tutup
              </button>
              <button
                type="submit"
                form="paymentForm"
                className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Icon name="check_circle" className="text-sm" />
                <span>Konfirmasi Pencairan Dana</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
