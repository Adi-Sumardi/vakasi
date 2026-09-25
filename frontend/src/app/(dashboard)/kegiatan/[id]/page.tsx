import Image from 'next/image';

import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/kegiatan/status-badge';
import { ActivityActions } from '@/components/kegiatan/activity-actions';
import { ApprovalReviewPanel } from '@/components/kegiatan/approval-review-panel';
import { HeroStat, PageHeader } from '@/components/common/page-header';
import { ActivityDocuments } from '@/components/kegiatan/activity-documents';
import { EditActivityDialog } from '@/components/kegiatan/edit-activity-dialog';
import { RecalculateHonorDialog } from '@/components/kegiatan/recalculate-honor-dialog';
import { SianggarHandoffCard } from '@/components/kegiatan/sianggar-handoff-card';
import { getActivityServer } from '@/lib/api/activities.server';
import { meServer } from '@/lib/api/auth.server';
import { hasPermission } from '@/lib/api/auth';
import { activeOnly, activeOrCurrent } from '@/lib/api/master-data';
import { listActivityTypes, listFundSources, listHonorTypes, listUnits } from '@/lib/api/master-data.server';
import { formatRupiah } from '@/lib/format';
import { Hint } from '@/components/common/hint';

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [activity, user, activityTypes, units, fundSources, honorTypes] = await Promise.all([
    getActivityServer(Number(id)),
    meServer(),
    listActivityTypes(),
    listUnits(),
    listFundSources(),
    listHonorTypes(),
  ]);

  const isOwner = activity.creator?.id === user.id;
  const canSubmit = hasPermission(user, 'activities.submit');
  const canApprove = hasPermission(user, 'activities.approve');
  const canManageIntegration = hasPermission(user, 'integration.manage');
  const canManage = hasPermission(user, 'activities.update');
  // Mirrors ActivityPolicy::update(): the creator, any TU of the same
  // unit (a unit's kegiatan belongs to the school), or an Admin whose
  // scope covers the unit.
  const role = user.role?.name ?? '';
  const scopedUnitId = user.scoped_unit_id ?? null;
  const inScope = scopedUnitId === null || activity.unit.id === scopedUnitId;
  const isEditable = ['draft', 'rejected'].includes(activity.status);
  const canEditInfo =
    canManage &&
    isEditable &&
    (isOwner || (role === 'tu' && scopedUnitId !== null && inScope) || (['admin', 'super_admin'].includes(role) && inScope));
  const canUploadDocument = canEditInfo || (['admin', 'super_admin', 'keuangan'].includes(role) && inScope && hasPermission(user, 'documents.manage'));
  // Honor may only be (re)calculated while the activity is still editable —
  // once approved it is a financial snapshot (BR-03). Keuangan holds the
  // permission too, without owning the activity.
  const canRecalculateHonor =
    hasPermission(user, 'honors.calculate') && isEditable && (canEditInfo || (role === 'keuangan' && inScope));
  // Kepala Sekolah decides from a dedicated panel; the creator never
  // approves their own submission (separation of duties).
  const showReview = canApprove && activity.status === 'submitted' && !isOwner && inScope;
  const honorTotal = (activity.honor_details ?? []).reduce((sum, d) => sum + d.net_amount, 0);
  const unitChoices = scopedUnitId ? units.filter((u) => u.id === scopedUnitId) : activeOrCurrent(units, activity.unit.id);

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: 'Kegiatan', href: '/kegiatan' }, { label: activity.activity_code }]}
        title={activity.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-space-sm">
            <StatusBadge status={activity.status} />
            <span>
              {activity.activity_code} · {activity.unit?.name} · {activity.activity_type?.name}
            </span>
          </span>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm">
          <HeroStat label="Anggaran" value={formatRupiah(activity.budget_amount)} />
          <HeroStat label="Total honor" value={formatRupiah(honorTotal)} />
          <HeroStat label="Panitia" value={`${activity.members?.length ?? 0} orang`} />
          <HeroStat label="Jadwal" value={activity.start_date} hint={activity.end_date !== activity.start_date ? `s/d ${activity.end_date}` : undefined} />
        </div>
      </PageHeader>

      {showReview && <ApprovalReviewPanel activity={activity} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        <div className="lg:col-span-2 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30">
            <div className="flex items-center justify-between mb-space-md">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Informasi Kegiatan</h2>
              {canEditInfo && (
                <EditActivityDialog
                  activity={activity}
                  activityTypes={activeOrCurrent(activityTypes, activity.activity_type.id)}
                  units={unitChoices}
                  fundSources={activeOrCurrent(fundSources, activity.fund_source.id)}
                />
              )}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm font-body-sm text-body-sm">
              <dt className="text-on-surface-variant">Jadwal</dt>
              <dd className="text-on-surface font-medium">{activity.start_date} - {activity.end_date}</dd>
              <dt className="text-on-surface-variant">Lokasi</dt>
              <dd className="text-on-surface font-medium">{activity.location || '—'}</dd>
              <dt className="text-on-surface-variant">Sumber Dana</dt>
              <dd className="text-on-surface font-medium">{activity.fund_source?.name}</dd>
              <dt className="text-on-surface-variant">Dibuat oleh</dt>
              <dd className="text-on-surface font-medium">{activity.creator?.name}</dd>
              <dt className="text-on-surface-variant">Anggaran</dt>
              <dd className="text-on-surface font-medium font-currency-cell text-currency-cell">{formatRupiah(activity.budget_amount)}</dd>
            </dl>
            {activity.description && (
              <p className="mt-space-md font-body-sm text-body-sm text-on-surface-variant border-t border-outline-variant/30 pt-space-md">
                {activity.description}
              </p>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
            <div className="flex items-center justify-between gap-space-sm p-space-lg pb-0">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Peserta &amp; Honor ({activity.members?.length ?? 0})
              </h2>
              {canRecalculateHonor && <RecalculateHonorDialog activity={activity} honorTypes={activeOnly(honorTypes)} />}
            </div>
            {(activity.honor_details?.length ?? 0) === 0 ? (
              <p className="p-space-lg font-body-sm text-body-sm text-on-surface-variant">Belum ada honor dihitung.</p>
            ) : (
              <div className="overflow-x-auto mt-space-md">
                <table className="w-full text-left font-body-sm text-body-sm border-collapse">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm border-y border-outline-variant/30">
                    <tr>
                      <th className="px-space-lg py-space-sm font-bold">Nama / Peran</th>
                      <th className="px-space-lg py-space-sm font-bold">Jenis Honor</th>
                      <th className="px-space-lg py-space-sm text-center font-bold">Volume</th>
                      <th className="px-space-lg py-space-sm text-right font-bold">Netto</th>
                      <th className="px-space-lg py-space-sm w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    {activity.honor_details?.map((d) => (
                      <tr key={d.id}>
                        <td className="px-space-lg py-space-sm">
                          <div className="font-medium text-on-surface">{d.employee.name}</div>
                          {d.role_name && <div className="text-outline text-xs">{d.role_name}</div>}
                        </td>
                        <td className="px-space-lg py-space-sm text-on-surface-variant">
                          <div>{d.honor_type.name}</div>
                          {d.rate_decree_number && <div className="text-outline text-xs">SK Tarif: {d.rate_decree_number}</div>}
                        </td>
                        <td className="px-space-lg py-space-sm text-center">{d.volume} {d.unit_snapshot}</td>
                        <td className="px-space-lg py-space-sm text-right font-currency-cell text-currency-cell text-primary font-bold">
                          {formatRupiah(d.net_amount)}
                        </td>
                        <td className="px-space-lg py-space-sm text-center">
                          <Hint label="Cetak Slip">
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/activities/${activity.id}/employees/${d.employee.id}/honor-slip`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors"
                            >
                              <Icon name="description" className="text-[18px]" />
                            </a>
                          </Hint>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ActivityDocuments
            activityId={activity.id}
            documents={activity.documents ?? []}
            canUpload={canUploadDocument}
          />

          {(activity.approvals?.length ?? 0) > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-md">Riwayat Approval</h2>
              <div className="flex flex-col gap-space-sm">
                {activity.approvals?.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border-b border-outline-variant/20 pb-space-sm last:border-0">
                    <div>
                      <div className="font-label-md text-label-md font-semibold text-on-surface">
                        {a.approver?.name ?? 'Menunggu Kepala Sekolah'}
                      </div>
                      {a.notes && <div className="text-on-surface-variant text-xs">{a.notes}</div>}
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-space-lg">
          {activity.budget && (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-md">Anggaran</h3>
              <div className="flex flex-col gap-space-sm font-body-sm text-body-sm">
                <div className="flex justify-between"><span className="text-on-surface-variant">Pagu</span><span className="font-currency-cell text-currency-cell">{formatRupiah(activity.budget.budget_amount)}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Diajukan</span><span className="font-currency-cell text-currency-cell">{formatRupiah(activity.budget.committed_amount)}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Dibayar</span><span className="font-currency-cell text-currency-cell">{formatRupiah(activity.budget.paid_amount)}</span></div>
                <div className="flex justify-between border-t border-outline-variant/30 pt-space-sm"><span className="text-tertiary font-semibold">Sisa</span><span className="font-currency-cell text-currency-cell text-tertiary font-bold">{formatRupiah(activity.budget.remaining_amount)}</span></div>
              </div>
            </div>
          )}

          <SianggarHandoffCard activity={activity} canRetry={canManageIntegration} />

          {activity.verification_code && (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col items-center text-center gap-space-sm">
              <div className="self-start">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Bukti Approval</h3>
                {activity.approval_document_number && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant font-mono">{activity.approval_document_number}</p>
                )}
              </div>
              {/* unoptimized: the QR is generated per request by the API
                  and is already a small PNG — running it through the
                  image optimizer would only add a hop. */}
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/verify/${activity.verification_code}/qrcode`}
                alt="QR Code bukti approval"
                width={128}
                height={128}
                unoptimized
                className="w-32 h-32"
              />
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Pindai untuk verifikasi publik, atau bagikan tautan berikut:
              </p>
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL}/verify/${activity.verification_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body-sm text-body-sm text-primary hover:underline break-all"
              >
                {process.env.NEXT_PUBLIC_APP_URL}/verify/{activity.verification_code}
              </a>
            </div>
          )}

          <ActivityActions
            activity={activity}
            isOwner={isOwner || canEditInfo}
            canSubmit={canSubmit}
            canApprove={false}
            canManage={canManage}
          />
        </div>
      </div>
    </div>
  );
}
