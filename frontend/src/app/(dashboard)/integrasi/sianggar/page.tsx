import Link from 'next/link';

import { Unauthorized } from '@/components/layout/unauthorized';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { SianggarRetryButton } from '@/components/integrasi/sianggar-retry-button';
import { listPendingSianggarHandoffs } from '@/lib/api/integrations.server';
import { SIANGGAR_STATUS_LABEL } from '@/lib/api/activities';
import { meServer } from '@/lib/api/auth.server';
import { hasPermission } from '@/lib/api/auth';
import { formatRupiah } from '@/lib/format';

/**
 * Operational view over the handoff to Sianggar (FLOW.md section 8).
 * The push runs automatically on approval; this page exists for the ones
 * that did not get through, so an approved kegiatan never sits waiting
 * for a pencairan that SDM was never told about.
 */
export default async function SianggarIntegrationPage() {
  const me = await meServer();

  if (!hasPermission(me, 'integration.manage')) {
    return <Unauthorized />;
  }

  const activities = await listPendingSianggarHandoffs();

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Pengiriman ke Sianggar</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Kegiatan yang sudah disetujui tetapi datanya belum sampai ke menu Vakasi di Sianggar. Selama belum
          terkirim, SDM tidak dapat mengunduh datanya untuk diajukan ke Sianggar.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {activities.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">
            Semua kegiatan yang disetujui sudah terkirim ke Sianggar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Kegiatan</th>
                  <th className="px-space-base py-space-sm font-bold">No. SK</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Anggaran</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Status Kirim</th>
                  <th className="px-space-base py-space-sm font-bold">Keterangan</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-surface-container-low/50 transition-colors align-top">
                    <td className="px-space-base py-space-sm">
                      <Link
                        href={`/kegiatan/${activity.id}`}
                        className="font-label-md text-label-md font-semibold text-primary hover:underline"
                      >
                        {activity.activity_code}
                      </Link>
                      <div className="text-outline text-xs">{activity.name}</div>
                    </td>
                    <td className="px-space-base py-space-sm font-mono text-on-surface-variant">
                      {activity.approval_document_number ?? '—'}
                    </td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell">
                      {formatRupiah(activity.budget_amount)}
                    </td>
                    <td className="px-space-base py-space-sm text-center">
                      <StatusBadge status={activity.sianggar_status ?? 'pending'} />
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant max-w-xs break-words">
                      {activity.sianggar_last_error ??
                        SIANGGAR_STATUS_LABEL[activity.sianggar_status ?? 'pending']}
                    </td>
                    <td className="px-space-base py-space-sm text-center">
                      <SianggarRetryButton activityId={activity.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
