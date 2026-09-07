'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { toast } from 'sonner';

interface ApprovalRecipient {
  name: string;
  nip: string;
  golongan: string;
  role: string;
  volume: string;
  rate: number;
  gross: number;
  tax: number;
  taxLabel: string;
  net: number;
  bank: string;
  account: string;
  accountName: string;
}

const RECIPIENTS: ApprovalRecipient[] = [
  {
    name: 'Prof. Dr. Ir. R. Santoso, M.Sc',
    nip: '196508191990031001',
    golongan: 'Gol IV/e',
    role: 'Narasumber Utama',
    volume: '6 Jam',
    rate: 1000000,
    gross: 6000000,
    tax: 900000,
    taxLabel: '(15%) 900.000',
    net: 5100000,
    bank: 'BNI',
    account: '0239182391',
    accountName: 'R. Santoso',
  },
  {
    name: 'Dr. Anisa Rahmawati, S.Kom, M.T',
    nip: '198203112008122003',
    golongan: 'Gol IV/a',
    role: 'Narasumber Pendamping',
    volume: '4 Jam',
    rate: 900000,
    gross: 3600000,
    tax: 540000,
    taxLabel: '(15%) 540.000',
    net: 3060000,
    bank: 'Mandiri',
    account: '131-00-1928312',
    accountName: 'Anisa Rahmawati',
  },
  {
    name: 'Ir. Bambang Sujatmiko, M.Eng',
    nip: '197804122003121002',
    golongan: 'Gol IV/b',
    role: 'Moderator Sesi',
    volume: '2 Jam',
    rate: 700000,
    gross: 1400000,
    tax: 210000,
    taxLabel: '(15%) 210.000',
    net: 1190000,
    bank: 'BRI',
    account: '0019-01-029182-50-1',
    accountName: 'Bambang Sujatmiko',
  },
  {
    name: 'Hendra Wijaya, S.Kom, M.Cs',
    nip: '198907152019031008',
    golongan: 'Gol III/c',
    role: 'Ketua Panitia',
    volume: '2 Hari',
    rate: 500000,
    gross: 1000000,
    tax: 50000,
    taxLabel: '(5%) 50.000',
    net: 950000,
    bank: 'Mandiri',
    account: '131-00-8819201',
    accountName: 'Hendra Wijaya',
  },
  {
    name: 'Siti Nurhaliza, S.AP',
    nip: '199204182018012001',
    golongan: 'Gol III/b',
    role: 'Sekretaris Panitia',
    volume: '2 Hari',
    rate: 450000,
    gross: 900000,
    tax: 45000,
    taxLabel: '(5%) 45.000',
    net: 855000,
    bank: 'BNI',
    account: '0812901829',
    accountName: 'Siti Nurhaliza',
  },
  {
    name: 'Budi Prasetyo, A.Md',
    nip: '199411032020121005',
    golongan: 'Gol II/c',
    role: 'Anggota Panitia Teknis',
    volume: '2 Hari',
    rate: 350000,
    gross: 700000,
    tax: 0,
    taxLabel: '(0%) 0',
    net: 700000,
    bank: 'BRI',
    account: '0341-01-098210-53-2',
    accountName: 'Budi Prasetyo',
  },
];

export default function ApprovalKegiatanPage() {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [ppkNote, setPpkNote] = useState('Berkas lengkap dan sesuai SBM PMK No. 49. Rekomendasi disetujui.');
  const [statusApproved, setStatusApproved] = useState(false);

  function handleApprove() {
    setShowApproveModal(false);
    setStatusApproved(true);
    toast.success('Pengajuan KGT-2025-089 berhasil disetujui! Diteruskan ke Bendahara Pengeluaran.');
  }

  function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi sebelum menolak pengajuan!');
      return;
    }
    toast.error(`Pengajuan ditolak dengan alasan: "${rejectionReason}". Dikembalikan ke Staf TU.`);
    setRejectionReason('');
  }

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      {/* Breadcrumb & Header Action Band */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-space-md">
        <div className="flex flex-col gap-space-2xs">
          <nav className="flex items-center gap-space-xs text-body-sm font-body-sm text-outline">
            <Link href="/kegiatan" className="hover:text-primary transition-colors">
              Kegiatan
            </Link>
            <Icon name="chevron_right" className="text-sm" />
            <span className="hover:text-primary cursor-pointer transition-colors">Menunggu Approval</span>
            <Icon name="chevron_right" className="text-sm" />
            <span className="font-semibold text-on-surface font-mono text-label-sm">KGT-2025-089</span>
          </nav>
          <div className="flex flex-wrap items-center gap-space-sm mt-space-2xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Persetujuan Beban Anggaran &amp; Honorarium
            </h1>
            <div className="flex items-center gap-space-xs px-space-md py-space-2xs rounded-full bg-secondary-container text-on-secondary-fixed shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="font-label-sm text-label-sm font-semibold tracking-wide">
                {statusApproved ? 'Disetujui PPK (Telah Selesai)' : 'Menunggu Approval PPK'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Action Toolbar */}
        <div className="flex items-center flex-wrap gap-space-sm">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-all border border-outline-variant/40 shadow-xs"
            title="Cetak Lembar Verifikasi"
          >
            <Icon name="print" className="text-secondary" />
            <span className="font-label-md text-label-md">Cetak Verifikasi</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('rejection-card');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-error-container hover:bg-error-container/80 text-on-error-container transition-all shadow-xs"
          >
            <Icon name="cancel" className="text-error" />
            <span className="font-label-md text-label-md font-semibold">Tolak Pengajuan</span>
          </button>
          <button
            type="button"
            onClick={() => setShowApproveModal(true)}
            disabled={statusApproved}
            className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-tertiary hover:bg-tertiary/90 text-on-tertiary transition-all shadow-md active:scale-98 disabled:opacity-50"
          >
            <Icon name="verified" />
            <span className="font-label-md text-label-md font-semibold tracking-wide">
              {statusApproved ? 'Sudah Disetujui' : 'Setujui Pengajuan'}
            </span>
          </button>
        </div>
      </div>

      {/* Fiscal KPI Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Pagu Anggaran Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
              Pagu Anggaran Unit
            </span>
            <Icon name="account_balance_wallet" className="text-primary text-base" />
          </div>
          <div>
            <div className="font-currency-display text-currency-display text-on-surface tabular-nums">
              Rp 50.000.000
            </div>
            <div className="flex items-center gap-space-xs mt-space-2xs text-body-sm font-body-sm text-outline">
              <span className="font-mono text-label-sm font-semibold text-primary">MAK 521213</span>
              <span>•</span>
              <span className="truncate">Honor Output Kegiatan</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between text-label-sm font-label-sm text-secondary border-t border-outline-variant/20">
            <span>Sisa Alokasi Terbuka</span>
            <span className="font-mono font-semibold text-on-surface">Rp 17.500.000</span>
          </div>
        </div>

        {/* Total Pengajuan Honor Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
              Total Beban Diajukan
            </span>
            <Icon name="receipt_long" className="text-secondary text-base" />
          </div>
          <div>
            <div className="font-currency-display text-currency-display text-on-surface tabular-nums">
              Rp 32.500.000
            </div>
            <div className="flex items-center gap-space-xs mt-space-2xs text-body-sm font-body-sm text-secondary">
              <span className="px-space-xs py-space-2xs rounded bg-surface-container font-mono text-label-sm text-on-surface-variant font-medium">
                Bruto
              </span>
              <span>Potongan PPh: Rp 3.650.000</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between text-label-sm font-label-sm bg-surface-container-low px-space-sm py-space-2xs rounded">
            <span className="text-outline">Netto Salurkan:</span>
            <span className="font-mono font-bold text-tertiary">Rp 28.850.000</span>
          </div>
        </div>

        {/* Rasio Serapan & SBM Gauge Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-tertiary" />
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
              Rasio Pagu &amp; Compliance
            </span>
            <span className="px-space-xs py-space-2xs rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
              65%
            </span>
          </div>
          <div>
            <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden flex my-space-xs">
              <div className="bg-tertiary h-full rounded-full transition-all duration-500" style={{ width: '65%' }} />
            </div>
            <div className="flex items-center justify-between text-label-sm font-label-sm text-outline mt-space-2xs">
              <span>Pengajuan Ini: 65%</span>
              <span>Maksimal 100%</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center gap-space-xs text-label-sm font-label-sm text-tertiary border-t border-outline-variant/20">
            <Icon name="check_circle" fill className="text-sm" />
            <span className="font-semibold">Memenuhi Syarat Standar Biaya Masukan (SBM)</span>
          </div>
        </div>

        {/* Jumlah Penerima Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary-container" />
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
              Distribusi Penerima
            </span>
            <Icon name="group" className="text-primary text-base" />
          </div>
          <div>
            <div className="font-currency-display text-currency-display text-on-surface tabular-nums">
              8 <span className="font-body-md text-body-md text-outline font-normal">Pegawai</span>
            </div>
            <div className="flex items-center gap-space-xs mt-space-2xs text-body-sm font-body-sm">
              <span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant text-label-sm font-semibold">
                4 Internal
              </span>
              <span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant text-label-sm font-semibold">
                2 Eksternal
              </span>
              <span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant text-label-sm font-semibold">
                2 Panitia
              </span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between text-label-sm font-label-sm text-outline border-t border-outline-variant/20">
            <span>Validitas Nomor Rekening:</span>
            <span className="text-tertiary font-semibold flex items-center gap-space-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />100% Cocok
            </span>
          </div>
        </div>
      </div>

      {/* Main Body 2-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-space-lg">
          {/* Card 1: Informasi Kegiatan */}
          <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-xs border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-md mb-space-md bg-surface-container-low/40 -mx-space-xl px-space-xl -mt-space-xl pt-space-lg rounded-t-xl border-b border-outline-variant/30">
              <div className="flex items-center gap-space-sm">
                <Icon name="event_note" className="text-primary" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Informasi Penugasan &amp; Kegiatan
                </h2>
              </div>
              <span className="px-space-sm py-space-2xs rounded bg-surface-container-highest text-on-surface-variant font-mono text-label-sm font-semibold">
                ID: EV-2025-0428
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-space-xl gap-y-space-md font-body-sm text-body-sm">
              <div className="md:col-span-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-space-2xs font-semibold">
                  Nama Kegiatan
                </span>
                <div className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-snug">
                  Workshop Evaluasi &amp; Penyelarasan Kurikulum MBKM 2025
                </div>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-space-2xs font-semibold">
                  Unit Penyelenggara
                </span>
                <div className="flex items-center gap-space-xs text-body-md font-body-md text-on-surface font-medium">
                  <Icon name="corporate_fare" className="text-secondary text-base" />
                  Biro Akademik dan Kemahasiswaan
                </div>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-space-2xs font-semibold">
                  Jadwal &amp; Waktu Pelaksanaan
                </span>
                <div className="flex items-center gap-space-xs text-body-md font-body-md text-on-surface font-medium">
                  <Icon name="schedule" className="text-secondary text-base" />
                  24 - 25 Maret 2025 (08.30 - 16.00 WIB)
                </div>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-space-2xs font-semibold">
                  Lokasi Ruang Rapat
                </span>
                <div className="flex items-center gap-space-xs text-body-md font-body-md text-on-surface font-medium">
                  <Icon name="meeting_room" className="text-secondary text-base" />
                  Ruang Rapat Senat Gedung Rektorat Lt. 3
                </div>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-space-2xs font-semibold">
                  Penanggung Jawab (PIC)
                </span>
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                    Ir. Bambang Sujatmiko, M.Eng
                  </span>
                  <span className="text-body-sm font-body-sm text-outline font-mono">
                    NIP. 197804122003121002
                  </span>
                </div>
              </div>
              <div className="md:col-span-2 pt-space-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-space-2xs font-semibold">
                  Dasar Pelaksanaan &amp; Legalitas
                </span>
                <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-start gap-space-sm">
                  <Icon name="gavel" className="text-primary mt-0.5 text-base" />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      SK Rektor No. 042/UN.2025/HK/KP tentang Tim Kurikulum
                    </span>
                    <span className="font-body-sm text-body-sm text-secondary">
                      Telah disahkan oleh Bagian Hukum &amp; Tata Laksana pada 10 Februari 2025
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Rincian Peserta & Nominal Honor */}
          <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-xs border border-outline-variant/30 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md mb-space-md gap-space-sm bg-surface-container-low/40 -mx-space-xl px-space-xl -mt-space-xl pt-space-lg rounded-t-xl border-b border-outline-variant/30">
              <div className="flex items-center gap-space-sm">
                <Icon name="badge" className="text-primary" />
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    Daftar Peserta &amp; Komputasi Pajak Honorarium
                  </h2>
                  <span className="font-body-sm text-body-sm text-outline">
                    Verifikasi kepatuhan tarif berdasarkan SBM 2025 PMK No. 49
                  </span>
                </div>
              </div>
              <span className="px-space-sm py-space-2xs rounded bg-surface-container font-mono text-label-sm text-on-surface-variant font-medium">
                {RECIPIENTS.length} Baris Terverifikasi
              </span>
            </div>

            <div className="overflow-x-auto -mx-space-xl px-space-xl">
              <table className="w-full text-left border-collapse font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low text-outline font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-space-sm px-space-md rounded-l font-bold">Nama / Identitas</th>
                    <th className="py-space-sm px-space-md font-bold">Peran SBM</th>
                    <th className="py-space-sm px-space-sm text-center font-bold">Vol</th>
                    <th className="py-space-sm px-space-md text-right font-bold">Tarif Satuan</th>
                    <th className="py-space-sm px-space-md text-right font-bold">Bruto</th>
                    <th className="py-space-sm px-space-md text-right font-bold">PPh 21</th>
                    <th className="py-space-sm px-space-md text-right font-bold">Netto</th>
                    <th className="py-space-sm px-space-md rounded-r font-bold">Rekening Tujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low text-on-surface">
                  {RECIPIENTS.map((rec, i) => (
                    <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-space-sm px-space-md">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-space-xs">
                            <span className="font-label-md text-label-md font-semibold text-on-surface">
                              {rec.name}
                            </span>
                            <Icon name="verified" fill className="text-tertiary text-sm" />
                          </div>
                          <span className="font-mono text-body-sm text-outline">
                            NIP. {rec.nip} ({rec.golongan})
                          </span>
                        </div>
                      </td>
                      <td className="py-space-sm px-space-md">
                        <span className="px-space-xs py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-medium">
                          {rec.role}
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm text-center font-mono font-medium">{rec.volume}</td>
                      <td className="py-space-sm px-space-md text-right font-currency-cell text-currency-cell tabular-nums">
                        {rec.rate.toLocaleString('id-ID')}
                      </td>
                      <td className="py-space-sm px-space-md text-right font-currency-cell text-currency-cell tabular-nums font-semibold">
                        {rec.gross.toLocaleString('id-ID')}
                      </td>
                      <td className="py-space-sm px-space-md text-right font-mono text-error tabular-nums">
                        {rec.taxLabel}
                      </td>
                      <td className="py-space-sm px-space-md text-right font-currency-cell text-currency-cell tabular-nums text-tertiary font-bold">
                        {rec.net.toLocaleString('id-ID')}
                      </td>
                      <td className="py-space-sm px-space-md">
                        <div className="flex flex-col text-label-sm text-label-sm">
                          <span className="font-semibold text-on-surface">
                            {rec.bank} - {rec.account}
                          </span>
                          <span className="text-outline">a.n {rec.accountName}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Dokumen Bukti Pendukung */}
          <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-xs border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-sm mb-space-md border-b border-outline-variant/30">
              <div className="flex items-center gap-space-sm">
                <Icon name="attach_file" className="text-primary" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Dokumen &amp; Bukti Pendukung
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary">4 Lampiran Terunggah</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <Icon name="picture_as_pdf" className="text-error text-2xl" />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Surat Tugas &amp; SK Tim</span>
                    <span className="text-xs text-outline">PDF • 2.4 MB</span>
                  </div>
                </div>
                <button type="button" onClick={() => toast.info('Mengunduh dokumen...')} className="text-primary hover:underline font-label-sm text-label-sm font-semibold">
                  Unduh
                </button>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <Icon name="picture_as_pdf" className="text-error text-2xl" />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Undangan &amp; Rundown</span>
                    <span className="text-xs text-outline">PDF • 850 KB</span>
                  </div>
                </div>
                <button type="button" onClick={() => toast.info('Mengunduh dokumen...')} className="text-primary hover:underline font-label-sm text-label-sm font-semibold">
                  Unduh
                </button>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <Icon name="picture_as_pdf" className="text-error text-2xl" />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Daftar Hadir Presensi</span>
                    <span className="text-xs text-outline">PDF • 1.2 MB</span>
                  </div>
                </div>
                <button type="button" onClick={() => toast.info('Mengunduh dokumen...')} className="text-primary hover:underline font-label-sm text-label-sm font-semibold">
                  Unduh
                </button>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <Icon name="table_chart" className="text-tertiary text-2xl" />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Rincian Anggaran (RAB)</span>
                    <span className="text-xs text-outline">XLSX • 420 KB</span>
                  </div>
                </div>
                <button type="button" onClick={() => toast.info('Mengunduh dokumen...')} className="text-primary hover:underline font-label-sm text-label-sm font-semibold">
                  Unduh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-space-lg">
          {/* Timeline Audit Trail */}
          <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-xs border border-outline-variant/30">
            <div className="flex items-center gap-space-sm pb-space-sm mb-space-md border-b border-outline-variant/30">
              <Icon name="receipt_long" className="text-secondary" />
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Riwayat Persetujuan
              </h3>
            </div>
            <div className="relative pl-6 space-y-space-md border-l-2 border-outline-variant/50 ml-3">
              {/* Step 1 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-tertiary ring-4 ring-surface-container-lowest" />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Pembuatan Draft Kegiatan
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary">
                    18 Mar 2025, 09:12 WIB oleh Budi Santoso (TU)
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-tertiary ring-4 ring-surface-container-lowest" />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Verifikasi Kelengkapan Berkas TU
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary">
                    19 Mar 2025, 14:30 WIB oleh Siti Nurhaliza (Verifikator)
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-primary ring-4 ring-surface-container-lowest animate-pulse" />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-primary font-bold">
                    Menunggu Approval PPK
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary">
                    Dalam penelaahan Dr. H. Mulyadi, M.Pd (PPK)
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative opacity-50">
                <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-surface-container-highest ring-4 ring-surface-container-lowest" />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-outline font-semibold">
                    Bendahara Pengeluaran
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">
                    Pencairan transfer &amp; CMS Bank
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lembar Catatan PPK */}
          <div className="bg-surface-container-lowest rounded-xl p-space-xl shadow-xs border border-outline-variant/30">
            <div className="flex items-center gap-space-sm pb-space-sm mb-space-md border-b border-outline-variant/30">
              <Icon name="edit_note" className="text-primary" />
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Catatan Verifikasi PPK
              </h3>
            </div>
            <textarea
              rows={3}
              value={ppkNote}
              onChange={(e) => setPpkNote(e.target.value)}
              className="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
            />
            <span className="text-[11px] text-outline block mt-1">
              Catatan ini akan direkam dalam lembar pengesahan SPJ digital.
            </span>
          </div>

          {/* Form Penolakan */}
          <div id="rejection-card" className="bg-surface-container-lowest rounded-xl p-space-xl shadow-xs border border-error/30">
            <div className="flex items-center gap-space-sm pb-space-sm mb-space-md border-b border-error/20">
              <Icon name="report_problem" className="text-error" />
              <h3 className="font-headline-sm text-headline-sm text-error font-semibold">
                Form Penolakan Pengajuan
              </h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
              Sesuai aturan audit keuangan, penolakan harus menyertakan alasan tertulis yang jelas.
            </p>
            <form onSubmit={handleReject} className="space-y-space-sm">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Tuliskan alasan penolakan atau perbaikan anggaran yang diperlukan..."
                className="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-error hover:bg-error/90 text-on-error font-label-md text-label-md font-semibold transition-colors"
              >
                Kirim Penolakan &amp; Kembalikan
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal Confirmation Setujui */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-xl border border-outline-variant/40 shadow-xl">
            <div className="flex items-center gap-space-sm text-tertiary mb-space-sm">
              <Icon name="verified" className="text-3xl" />
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Konfirmasi Persetujuan PPK
              </h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
              Apakah Anda yakin menyetujui beban anggaran kegiatan <strong className="text-on-surface">KGT-2025-089</strong> sebesar <strong className="text-tertiary">Rp 32.500.000 (Bruto)</strong>? Berkas akan otomatis dialihkan ke antrean pencairan dana Bendahara Pengeluaran.
            </p>
            <div className="flex items-center justify-end gap-space-sm">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-5 py-2 rounded-lg bg-tertiary hover:bg-tertiary/90 text-on-tertiary font-label-md text-label-md font-semibold shadow-xs"
              >
                Ya, Setujui Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
