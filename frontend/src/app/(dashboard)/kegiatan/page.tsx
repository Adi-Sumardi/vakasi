'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const ACTIVITIES = [
  {
    id: '1',
    code: 'KGT-2025-089',
    title: 'Workshop Evaluasi Kurikulum Merdeka',
    unit: 'Biro Akademik',
    date: '24 - 25 Mar 2025',
    budget: 24500000,
    recipients: 5,
    status: 'Menunggu Approval',
    statusClass: 'bg-error-container text-on-error-container',
    dotClass: 'bg-error',
    link: '/kegiatan/approval',
  },
  {
    id: '2',
    code: 'KGT-2025-092',
    title: 'Sosialisasi Akreditasi Program Studi Internasional',
    unit: 'LP3M',
    date: '18 Mar 2025',
    budget: 18200000,
    recipients: 6,
    status: 'Draft Revisi',
    statusClass: 'bg-surface-container text-on-surface-variant',
    dotClass: 'bg-secondary',
    link: '/kegiatan/buat',
  },
  {
    id: '3',
    code: 'KGT-2025-084',
    title: 'Rapat Koordinasi Penyusunan Renstra 2026',
    unit: 'Bagian Perencanaan',
    date: '15 Mar 2025',
    budget: 32750000,
    recipients: 12,
    status: 'Verifikasi Pajak',
    statusClass: 'bg-secondary-container text-on-secondary-container',
    dotClass: 'bg-primary',
    link: '/kegiatan/approval',
  },
  {
    id: '4',
    code: 'KGT-2025-081',
    title: 'Reviewer Hibah Penelitian Fundamental 2025',
    unit: 'LPPM',
    date: '02 Mar 2025',
    budget: 28000000,
    recipients: 14,
    status: 'Selesai & Paid',
    statusClass: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    dotClass: 'bg-tertiary',
    link: '/honor',
  },
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SemuaKegiatanPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = ACTIVITIES.filter((a) => {
    if (search && !a.code.toLowerCase().includes(search.toLowerCase()) && !a.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
            Semua Kegiatan &amp; Kepanitiaan
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Register seluruh pengajuan kegiatan sekolah, verifikasi berkas, dan status honorarium.
          </p>
        </div>
        <Link
          href="/kegiatan/buat"
          className="flex items-center gap-space-xs px-space-lg py-space-sm bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-lg text-label-lg shadow-xs transition-all font-semibold self-start sm:self-auto"
        >
          <Icon name="add" className="text-base" />
          <span>+ Buat Kegiatan Baru</span>
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="p-space-base bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-md border-b border-outline-variant/30">
          <div className="flex items-center gap-space-xs overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'px-space-md py-space-xs rounded-lg font-label-md text-label-md font-semibold transition-all',
                filter === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container'
              )}
            >
              Semua ({ACTIVITIES.length})
            </button>
            <Link
              href="/kegiatan/approval"
              className="px-space-md py-space-xs rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-all flex items-center gap-1.5"
            >
              <span>Menunggu Approval</span>
              <span className="px-1.5 py-0.2 rounded-full bg-error-container text-on-error-container font-mono text-[11px] font-bold">
                4
              </span>
            </Link>
          </div>

          <div className="relative w-full sm:w-72">
            <Icon name="search" className="absolute left-3 top-2.5 text-outline text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kegiatan..."
              className="w-full h-9 pl-9 pr-3 text-body-sm bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-body-sm text-body-sm border-collapse">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
              <tr>
                <th className="px-space-base py-space-sm font-bold">No. Kegiatan &amp; Judul</th>
                <th className="px-space-base py-space-sm font-bold">Unit Kerja</th>
                <th className="px-space-base py-space-sm font-bold">Jadwal Pelaksanaan</th>
                <th className="px-space-base py-space-sm text-center font-bold">Penerima</th>
                <th className="px-space-base py-space-sm text-right font-bold">Total Anggaran</th>
                <th className="px-space-base py-space-sm text-center font-bold">Status</th>
                <th className="px-space-base py-space-sm text-center font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filtered.map((act) => (
                <tr key={act.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-space-base py-space-sm">
                    <div className="font-label-lg text-label-lg font-semibold text-primary">{act.code}</div>
                    <div className="font-body-sm text-body-sm text-on-surface font-medium">{act.title}</div>
                  </td>
                  <td className="px-space-base py-space-sm text-on-surface-variant">{act.unit}</td>
                  <td className="px-space-base py-space-sm text-on-surface-variant">{act.date}</td>
                  <td className="px-space-base py-space-sm text-center">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface">
                      {act.recipients} Orang
                    </span>
                  </td>
                  <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell tabular-nums">
                    {formatRupiah(act.budget)}
                  </td>
                  <td className="px-space-base py-space-sm text-center">
                    <span className={cn('inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-semibold', act.statusClass)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', act.dotClass)} />
                      {act.status}
                    </span>
                  </td>
                  <td className="px-space-base py-space-sm text-center">
                    <Link
                      href={act.link}
                      className="px-3 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold transition-all border border-outline-variant/30 inline-flex items-center gap-1"
                    >
                      <Icon name="visibility" className="text-sm" />
                      <span>Detail</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
