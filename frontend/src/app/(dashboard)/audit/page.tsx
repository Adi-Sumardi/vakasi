import Link from 'next/link';

import { Unauthorized } from '@/components/layout/unauthorized';
import { listAuditLogsServer } from '@/lib/api/audit.server';
import { meServer } from '@/lib/api/auth.server';
import { hasPermission } from '@/lib/api/auth';

const ACTION_LABEL: Record<string, string> = {
  'activity.created': 'Kegiatan dibuat',
  'activity.updated': 'Kegiatan diperbarui',
  'activity.member_added': 'Peserta ditambahkan',
  'activity.member_removed': 'Peserta dihapus',
  'activity.deleted': 'Kegiatan dihapus',
  'activity.submitted': 'Kegiatan disubmit',
  'activity.approved': 'Kegiatan disetujui',
  'activity.rejected': 'Kegiatan ditolak',
  'activity.verified': 'Kegiatan diverifikasi',
  'activity.processing': 'Kegiatan diproses',
  'activity.paid': 'Kegiatan dibayar',
  'activity.completed': 'Kegiatan selesai',
  'payment.created': 'Pembayaran dibuat',
  'payment.completed': 'Pembayaran selesai',
  'document.uploaded': 'Dokumen diunggah',
};

export default async function AuditTrailPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const me = await meServer();

  if (!hasPermission(me, 'audit.view')) {
    return <Unauthorized />;
  }

  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const { items: logs, meta } = await listAuditLogsServer(currentPage);

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Audit Trail</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Riwayat seluruh perubahan penting: siapa, kapan, dan aksi apa yang dilakukan.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">Belum ada aktivitas tercatat.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Waktu</th>
                  <th className="px-space-base py-space-sm font-bold">Pengguna</th>
                  <th className="px-space-base py-space-sm font-bold">Aksi</th>
                  <th className="px-space-base py-space-sm font-bold">Entitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-space-base py-space-sm text-on-surface-variant font-mono text-xs">{log.created_at}</td>
                    <td className="px-space-base py-space-sm text-on-surface font-medium">{log.user ?? 'Sistem'}</td>
                    <td className="px-space-base py-space-sm">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">
                      {log.entity_type} #{log.entity_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta.total > 0 && (
        <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
          <span>
            Menampilkan halaman {meta.current_page} dari {meta.last_page} ({meta.total} log total)
          </span>
          <div className="flex gap-space-xs">
            <Link
              href={`/audit?page=${Math.max(1, meta.current_page - 1)}`}
              aria-disabled={meta.current_page <= 1}
              className={`px-3 py-1.5 rounded border border-outline-variant/40 font-label-sm text-label-sm font-semibold ${
                meta.current_page <= 1
                  ? 'pointer-events-none opacity-40'
                  : 'hover:bg-surface-container text-on-surface'
              }`}
            >
              Sebelumnya
            </Link>
            <Link
              href={`/audit?page=${Math.min(meta.last_page, meta.current_page + 1)}`}
              aria-disabled={meta.current_page >= meta.last_page}
              className={`px-3 py-1.5 rounded border border-outline-variant/40 font-label-sm text-label-sm font-semibold ${
                meta.current_page >= meta.last_page
                  ? 'pointer-events-none opacity-40'
                  : 'hover:bg-surface-container text-on-surface'
              }`}
            >
              Berikutnya
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
