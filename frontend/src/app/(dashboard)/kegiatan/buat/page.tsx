'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HonorRecipient {
  id: string;
  name: string;
  nip: string;
  golongan: string;
  taxRate: number; // e.g. 0.15 for 15%
  role: string;
  honorType: string;
  volume: number;
  unit: string;
  rate: number;
}

const INITIAL_RECIPIENTS: HonorRecipient[] = [
  {
    id: '1',
    name: 'Prof. Dr. Hendra Gunawan, M.Sc',
    nip: '196504121990031002',
    golongan: 'Gol IV/c',
    taxRate: 0.15,
    role: 'Narasumber Luar Biasa',
    honorType: 'Honorarium Narasumber',
    volume: 4,
    unit: 'Jam',
    rate: 1400000,
  },
  {
    id: '2',
    name: 'Dr. Ir. Sri Wahyuni, M.T',
    nip: '197208191998022001',
    golongan: 'Gol IV/a',
    taxRate: 0.15,
    role: 'Moderator Panelis',
    honorType: 'Honorarium Moderator',
    volume: 2,
    unit: 'Jam',
    rate: 700000,
  },
  {
    id: '3',
    name: 'Ahmad Fauzi, S.Kom',
    nip: '198503142010011015',
    golongan: 'Gol III/c',
    taxRate: 0.05,
    role: 'Panitia Pelaksana',
    honorType: 'Honorarium Panitia',
    volume: 2,
    unit: 'Hari',
    rate: 450000,
  },
  {
    id: '4',
    name: 'Rina Anggraini, S.E',
    nip: '199106202015042003',
    golongan: 'Gol III/b',
    taxRate: 0.05,
    role: 'Notulis & Pelaporan',
    honorType: 'Honorarium Panitia',
    volume: 2,
    unit: 'Hari',
    rate: 400000,
  },
  {
    id: '5',
    name: 'Dr. Bambang Hermanto, M.Ed',
    nip: '197901052005011004',
    golongan: 'Gol IV/b',
    taxRate: 0.15,
    role: 'Reviewer Kurikulum',
    honorType: 'Honorarium Reviewer',
    volume: 3,
    unit: 'Jam',
    rate: 1000000,
  },
];

const PAGU_BUDGET = 45000000;

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BuatKegiatanWizardPage() {
  const [currentStep, setCurrentStep] = useState(4); // default on Step 4 (Honor) per mockup
  const [recipients, setRecipients] = useState<HonorRecipient[]>(INITIAL_RECIPIENTS);
  const [autoSbm, setAutoSbm] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form add state
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    nip: '',
    golongan: 'Gol III/c',
    taxRate: 0.05,
    role: 'Anggota Panitia',
    honorType: 'Honorarium Panitia',
    volume: 1,
    unit: 'Hari',
    rate: 400000,
  });

  const totalBruto = recipients.reduce((sum, r) => sum + r.rate * r.volume, 0);
  const totalTax = recipients.reduce((sum, r) => sum + Math.round(r.rate * r.volume * r.taxRate), 0);
  const totalNetto = totalBruto - totalTax;
  const sisaPagu = PAGU_BUDGET - totalBruto;

  function handleVolumeChange(id: string, delta: number) {
    setRecipients((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newVol = Math.max(1, r.volume + delta);
          return { ...r, volume: newVol };
        }
        return r;
      })
    );
  }

  function handleDirectVolume(id: string, val: string) {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) return;
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, volume: parsed } : r))
    );
  }

  function handleDeleteRecipient(id: string) {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
    toast.success('Penerima honor berhasil dihapus');
  }

  function handleAddRecipientSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newRecipient.name) {
      toast.error('Nama wajib diisi');
      return;
    }
    const taxRate = newRecipient.golongan.includes('IV')
      ? 0.15
      : newRecipient.golongan.includes('III')
      ? 0.05
      : 0.05;

    const newItem: HonorRecipient = {
      id: Date.now().toString(),
      name: newRecipient.name,
      nip: newRecipient.nip || '198901012020011001',
      golongan: newRecipient.golongan,
      taxRate,
      role: newRecipient.role,
      honorType: newRecipient.honorType,
      volume: newRecipient.volume,
      unit: newRecipient.unit,
      rate: newRecipient.rate,
    };
    setRecipients([...recipients, newItem]);
    setShowAddModal(false);
    toast.success('Penerima honor berhasil ditambahkan');
    setNewRecipient({
      name: '',
      nip: '',
      golongan: 'Gol III/c',
      taxRate: 0.05,
      role: 'Anggota Panitia',
      honorType: 'Honorarium Panitia',
      volume: 1,
      unit: 'Hari',
      rate: 400000,
    });
  }

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl">
        <div className="flex flex-col gap-space-2xs">
          <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
            <Link href="/kegiatan" className="hover:text-primary transition-colors">
              Kegiatan
            </Link>
            <Icon name="chevron_right" className="text-xs text-outline" />
            <span className="hover:text-primary cursor-pointer transition-colors">Buat Kegiatan Baru</span>
            <Icon name="chevron_right" className="text-xs text-outline" />
            <span className="text-on-surface font-semibold">Form Pengajuan</span>
          </nav>
          <div className="flex items-center gap-space-sm mt-space-2xs flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Buat Pengajuan Kegiatan &amp; Honorarium
            </h1>
            <span className="px-space-sm py-space-2xs rounded-full bg-secondary-container text-on-secondary-fixed text-label-sm font-label-sm font-semibold">
              DRAFT #REG-2025-089
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={() => toast.success('Draft berhasil disimpan!')}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all border border-outline-variant/40 shadow-xs"
          >
            <Icon name="save" className="text-base" />
            <span>Simpan Draft</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all border border-outline-variant/40"
          >
            <Icon name="close" className="text-base" />
            <span>Tutup Form</span>
          </Link>
        </div>
      </div>

      {/* Stepper Bar (6 Steps) */}
      <div className="w-full bg-surface-container-lowest rounded-xl p-space-md mb-space-xl shadow-xs border border-outline-variant/30 overflow-x-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-space-sm min-w-[640px]">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-space-sm p-space-xs text-left cursor-pointer hover:bg-surface-container-low rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center shrink-0">
              <Icon name="check" className="text-sm font-bold" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">01. INFORMASI</span>
              <span className="font-body-sm text-body-sm text-on-surface truncate">Workshop OBE...</span>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="flex items-center gap-space-sm p-space-xs text-left cursor-pointer hover:bg-surface-container-low rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center shrink-0">
              <Icon name="check" className="text-sm font-bold" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">02. ANGGARAN</span>
              <span className="font-body-sm text-body-sm text-on-surface truncate">DIPA / Rp 45.000.000</span>
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className="flex items-center gap-space-sm p-space-xs text-left cursor-pointer hover:bg-surface-container-low rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center shrink-0">
              <Icon name="check" className="text-sm font-bold" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">03. PESERTA</span>
              <span className="font-body-sm text-body-sm text-on-surface truncate">{recipients.length} Penerima</span>
            </div>
          </button>

          {/* Step 4 (Honor Active) */}
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className={cn(
              'flex items-center gap-space-sm p-space-xs rounded-lg text-left transition-colors',
              currentStep === 4 ? 'bg-primary-fixed' : 'hover:bg-surface-container-low'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 font-label-md text-label-md font-bold">
              04
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-primary-fixed font-bold tracking-wider">
                04. HONOR AKTIF
              </span>
              <span className="font-body-sm text-body-sm text-on-primary-fixed truncate font-medium">
                Rincian &amp; Volume
              </span>
            </div>
          </button>

          {/* Step 5 */}
          <button
            type="button"
            onClick={() => setCurrentStep(5)}
            className={cn(
              'flex items-center gap-space-sm p-space-xs rounded-lg text-left transition-colors',
              currentStep === 5 ? 'bg-primary-fixed' : 'opacity-60 hover:opacity-100'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0 font-label-md text-label-md font-medium">
              05
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-outline font-semibold">05. REVIEW</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Rekapitulasi SPJ</span>
            </div>
          </button>

          {/* Step 6 */}
          <button
            type="button"
            onClick={() => setCurrentStep(6)}
            className={cn(
              'flex items-center gap-space-sm p-space-xs rounded-lg text-left transition-colors',
              currentStep === 6 ? 'bg-primary-fixed' : 'opacity-60 hover:opacity-100'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0 font-label-md text-label-md font-medium">
              06
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-outline font-semibold">06. SUBMIT</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Kirim Pengajuan</span>
            </div>
          </button>
        </div>
      </div>

      {/* Activity Context Card */}
      <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg mb-space-lg shadow-xs border border-outline-variant/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <div className="flex flex-wrap items-center gap-space-xs text-label-sm font-label-sm text-on-surface-variant">
              <span className="px-space-xs py-0.5 rounded bg-surface-container font-mono text-outline font-semibold">
                MAK: 521213
              </span>
              <span>•</span>
              <span className="text-primary font-semibold">Rupiah Murni (RM)</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="schedule" className="text-sm" /> 18 - 19 Maret 2025
              </span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
              Workshop Penyusunan Kurikulum Berbasis Outcome-Based Education (OBE)
            </h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Penanggung Jawab: Dr. Ir. Sri Wahyuni, M.T — Biro Administrasi Akademik &amp; Kemahasiswaan
            </span>
          </div>

          {/* Budget Usage Summary */}
          <div className="flex items-center gap-space-lg bg-surface-container-low rounded-xl p-space-md shrink-0 border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase font-semibold">
                Pagu Anggaran
              </span>
              <span className="font-currency-cell text-currency-cell text-on-surface">
                {formatRupiah(PAGU_BUDGET)}
              </span>
            </div>
            <div className="w-px h-8 bg-outline-variant/40" />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase font-semibold">
                Total Terpakai
              </span>
              <span className="font-currency-cell text-currency-cell text-primary font-bold">
                {formatRupiah(totalBruto)}
              </span>
            </div>
            <div className="w-px h-8 bg-outline-variant/40" />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-tertiary-fixed-variant tracking-wider uppercase font-semibold">
                Sisa Pagu Aman
              </span>
              <span className="font-currency-cell text-currency-cell text-tertiary font-bold">
                {formatRupiah(sisaPagu)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-md">
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-medium transition-all shadow-xs"
          >
            <Icon name="person_add" className="text-base" />
            <span>Tambah Penerima Honor</span>
          </button>
          <button
            type="button"
            onClick={() => toast.info('Template Excel siap diunggah.')}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-medium transition-all border border-outline-variant/40"
          >
            <Icon name="upload_file" className="text-base" />
            <span>Import dari Excel Peserta</span>
          </button>
        </div>

        {/* Toggle SBM */}
        <div className="flex items-center gap-space-md px-space-md py-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
          <div className="flex items-center gap-space-xs">
            <Icon name="verified" className="text-tertiary text-base" />
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              Auto-Hitung Tarif SBM 2025
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAutoSbm(!autoSbm)}
            className={cn(
              'w-9 h-5 rounded-full transition-colors relative focus:outline-none p-0.5',
              autoSbm ? 'bg-primary' : 'bg-surface-container-high'
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full bg-white transition-transform',
                autoSbm ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden mb-space-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-body-sm text-body-sm">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase select-none border-b border-outline-variant/30">
                <th className="py-space-md px-space-md text-center w-12 font-bold">No</th>
                <th className="py-space-md px-space-lg font-bold">Nama &amp; NIP / Golongan</th>
                <th className="py-space-md px-space-md font-bold">Peran Penugasan</th>
                <th className="py-space-md px-space-md font-bold">Jenis Honor</th>
                <th className="py-space-md px-space-md text-center w-36 font-bold">Volume</th>
                <th className="py-space-md px-space-md text-right font-bold">Tarif Satuan</th>
                <th className="py-space-md px-space-md text-right font-bold">Bruto (Gross)</th>
                <th className="py-space-md px-space-md text-right font-bold">PPh 21 (Pajak)</th>
                <th className="py-space-md px-space-lg text-right font-bold">Netto Diterima</th>
                <th className="py-space-md px-space-md text-center w-20 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low text-on-surface">
              {recipients.map((item, index) => {
                const gross = item.rate * item.volume;
                const tax = Math.round(gross * item.taxRate);
                const net = gross - tax;
                return (
                  <tr key={item.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-space-md px-space-md text-center font-mono text-outline">{index + 1}</td>
                    <td className="py-space-md px-space-lg">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-space-xs mt-0.5">
                          <span className="text-outline font-mono text-[11px]">{item.nip}</span>
                          <span
                            className={cn(
                              'px-space-xs py-0.5 rounded font-label-sm text-label-sm font-bold',
                              item.taxRate >= 0.15
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-surface-container text-on-surface-variant'
                            )}
                          >
                            {item.golongan}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="px-space-sm py-space-2xs rounded-full bg-surface-container font-label-sm text-label-sm font-medium">
                        {item.role}
                      </span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="font-body-sm text-body-sm">{item.honorType}</span>
                    </td>
                    <td className="py-space-md px-space-md">
                      <div className="flex items-center justify-center gap-1 bg-surface-container-low rounded-lg p-1 border border-outline-variant/40">
                        <button
                          type="button"
                          onClick={() => handleVolumeChange(item.id, -1)}
                          className="w-6 h-6 rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container flex items-center justify-center font-bold text-xs shadow-xs"
                        >
                          -
                        </button>
                        <input
                          type="text"
                          value={item.volume}
                          onChange={(e) => handleDirectVolume(item.id, e.target.value)}
                          className="w-8 text-center bg-transparent font-mono font-semibold text-on-surface focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleVolumeChange(item.id, 1)}
                          className="w-6 h-6 rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container flex items-center justify-center font-bold text-xs shadow-xs"
                        >
                          +
                        </button>
                        <span className="text-[11px] text-outline font-medium">{item.unit}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md text-right font-mono">
                      {formatRupiah(item.rate)}
                      <span className="text-outline text-xs">/{item.unit}</span>
                    </td>
                    <td className="py-space-md px-space-md text-right font-currency-cell text-currency-cell">
                      {formatRupiah(gross)}
                    </td>
                    <td className="py-space-md px-space-md text-right text-error font-mono">
                      <div className="flex flex-col items-end">
                        <span>-{formatRupiah(tax)}</span>
                        <span className="text-[10px] text-outline font-semibold">
                          PPh {item.taxRate * 100}%
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-lg text-right font-currency-cell text-currency-cell text-primary font-bold">
                      {formatRupiah(net)}
                    </td>
                    <td className="py-space-md px-space-md text-center">
                      <div className="flex items-center justify-center gap-space-2xs">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecipient(item.id)}
                          className="p-1 text-outline hover:text-error hover:bg-error-container rounded transition-colors"
                          title="Hapus Baris"
                        >
                          <Icon name="delete" className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Calculation Footer Bar */}
      <footer className="fixed bottom-0 left-0 lg:left-sidebar-width right-0 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/40 py-space-sm px-space-xl shadow-lg z-30 flex flex-col md:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-xl flex-wrap justify-center md:justify-start">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
              Total Bruto
            </span>
            <span className="font-currency-cell text-currency-cell text-on-surface font-semibold">
              {formatRupiah(totalBruto)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-error uppercase font-semibold">
              Potongan Pajak PPh 21
            </span>
            <span className="font-currency-cell text-currency-cell text-error font-semibold">
              -{formatRupiah(totalTax)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-primary uppercase font-bold">
              Total Netto Dibayarkan
            </span>
            <span className="font-currency-display text-headline-sm text-primary font-bold">
              {formatRupiah(totalNetto)}
            </span>
          </div>
          <div className="h-8 w-px bg-outline-variant/40 hidden xl:block" />
          <div className="hidden xl:flex flex-col">
            <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
              Sisa Pagu Setelah Ini
            </span>
            <span className="font-currency-cell text-currency-cell text-tertiary font-bold">
              {formatRupiah(sisaPagu)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            className="px-space-lg py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all border border-outline-variant/40"
          >
            &larr; Kembali
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentStep < 6) {
                setCurrentStep(currentStep + 1);
                toast.info(`Lanjut ke Langkah 0${currentStep + 1}`);
              } else {
                toast.success('Pengajuan kegiatan berhasil diajukan untuk approval!');
              }
            }}
            className="px-space-xl py-space-sm rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all shadow-xs flex items-center gap-1"
          >
            <span>{currentStep === 6 ? 'Kirim Pengajuan' : 'Lanjut: Review & Submit'}</span>
            <Icon name="arrow_forward" className="text-sm" />
          </button>
        </div>
      </footer>

      {/* Modal Add Recipient */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-xl border border-outline-variant/40 shadow-xl">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Tambah Penerima Honor
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={handleAddRecipientSubmit} className="space-y-space-md">
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  required
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  placeholder="Contoh: Dra. Hj. Maryati, M.Pd"
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    Golongan Pegawai
                  </label>
                  <select
                    value={newRecipient.golongan}
                    onChange={(e) => setNewRecipient({ ...newRecipient, golongan: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                  >
                    <option value="Gol IV/a">Gol IV (PPh 15%)</option>
                    <option value="Gol III/c">Gol III (PPh 5%)</option>
                    <option value="Gol II/d">Gol II (PPh 0%)</option>
                    <option value="Non-PNS">Non-PNS (PPh 5%)</option>
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    NIP / NIK
                  </label>
                  <input
                    type="text"
                    value={newRecipient.nip}
                    onChange={(e) => setNewRecipient({ ...newRecipient, nip: e.target.value })}
                    placeholder="19800101..."
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                  Peran Penugasan
                </label>
                <input
                  type="text"
                  value={newRecipient.role}
                  onChange={(e) => setNewRecipient({ ...newRecipient, role: e.target.value })}
                  placeholder="Contoh: Narasumber / Moderator / Panitia"
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    Tarif Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    value={newRecipient.rate}
                    onChange={(e) => setNewRecipient({ ...newRecipient, rate: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    Volume ({newRecipient.unit})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newRecipient.volume}
                    onChange={(e) => setNewRecipient({ ...newRecipient, volume: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-space-sm flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold"
                >
                  Simpan Penerima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
