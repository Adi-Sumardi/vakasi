'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { approveActivity, rejectActivity, SK_PANITIA, type Activity } from '@/lib/api/activities';
import { ApiError } from '@/lib/api/types';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

type Check = { label: string; detail: string; ok: boolean; blocking?: boolean };

/**
 * Kepala Sekolah's decision panel. Before approving, the checks below
 * are worked out from the activity itself, so the approver sees at a
 * glance what an approval would sign off on: approval freezes the honor
 * (financial snapshot) and hands it to Sianggar for payment.
 *
 * Only "SK Panitia" blocks: the API refuses a submission without it, so
 * a missing one here means the data changed underneath. The others are
 * warnings the approver may accept knowingly.
 */
export function ApprovalReviewPanel({ activity }: { activity: Activity }) {
  const router = useRouter();
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const details = activity.honor_details ?? [];
  const members = activity.members ?? [];
  const skPanitia = (activity.documents ?? []).filter((d) => d.document_type === SK_PANITIA);
  const honorTotal = details.reduce((sum, d) => sum + d.net_amount, 0);
  const withoutDecree = details.filter((d) => !d.rate_decree_number).length;
  const withoutBank = new Set(details.filter((d) => !d.employee.bank_account_number).map((d) => d.employee.id)).size;
  const overBudget = honorTotal > activity.budget_amount;

  const checks: Check[] = [
    {
      label: 'SK Panitia terlampir',
      detail: skPanitia.length > 0 ? skPanitia.map((d) => d.file_name).join(', ') : 'Belum ada SK Panitia.',
      ok: skPanitia.length > 0,
      blocking: true,
    },
    {
      label: 'Honor sudah dihitung',
      detail: details.length > 0 ? `${members.length} panitia, ${details.length} baris honor` : 'Belum ada perhitungan honor.',
      ok: details.length > 0,
    },
    {
      label: 'Honor tidak melebihi anggaran',
      detail: `${formatRupiah(honorTotal)} dari anggaran ${formatRupiah(activity.budget_amount)}`,
      ok: !overBudget,
    },
    {
      label: 'Setiap tarif punya dasar SK Yayasan',
      detail: withoutDecree === 0 ? 'Semua baris honor mencantumkan nomor SK tarif.' : `${withoutDecree} baris honor tanpa nomor SK tarif.`,
      ok: withoutDecree === 0,
    },
    {
      label: 'Rekening penerima lengkap',
      detail: withoutBank === 0 ? 'Semua penerima punya nomor rekening.' : `${withoutBank} penerima belum punya nomor rekening.`,
      ok: withoutBank === 0,
    },
  ];

  const blocked = checks.some((c) => c.blocking && !c.ok);
  const warnings = checks.filter((c) => !c.ok && !c.blocking).length;

  async function submit() {
    setBusy(true);
    try {
      if (mode === 'approve') {
        await approveActivity(activity.id, notes.trim() || undefined);
        toast.success('Kegiatan disetujui dan diteruskan ke Sianggar.');
      } else {
        await rejectActivity(activity.id, notes.trim());
        toast.success('Kegiatan dikembalikan ke TU dengan alasan penolakan.');
      }
      setMode('idle');
      setNotes('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan keputusan.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-gold bg-surface-container-lowest shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-space-sm px-space-lg py-space-md bg-gold-soft">
        <div className="flex items-center gap-space-sm">
          <span className="w-10 h-10 rounded-xl bg-gold text-on-gold flex items-center justify-center">
            <Icon name="verified" className="text-[20px]" />
          </span>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Keputusan Kepala Sekolah</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Diajukan oleh {activity.creator?.name ?? '-'}
              {activity.submitted_at ? ` pada ${new Date(activity.submitted_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}` : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Total honor</div>
          <div className="font-headline-sm text-headline-sm font-bold text-on-surface tabular-nums">{formatRupiah(honorTotal)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-space-lg p-space-lg">
        <ul className="flex flex-col gap-space-sm">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-space-sm">
              <span
                className={cn(
                  'mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                  check.ok ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : check.blocking ? 'bg-error-container text-on-error-container' : 'bg-gold-soft text-on-gold'
                )}
              >
                <Icon name={check.ok ? 'check' : 'error'} className="text-sm" />
              </span>
              <div>
                <div className="font-label-md text-label-md font-semibold text-on-surface">{check.label}</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">{check.detail}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-space-sm">
          {mode === 'idle' ? (
            <>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {blocked
                  ? 'Kegiatan belum bisa disetujui karena SK Panitia tidak ada. Tolak dan minta TU melengkapinya.'
                  : warnings > 0
                    ? `Ada ${warnings} catatan di samping. Anda tetap bisa menyetujui bila sudah diperiksa.`
                    : 'Semua pemeriksaan terpenuhi.'}
              </p>
              <button
                type="button"
                disabled={blocked}
                onClick={() => setMode('approve')}
                className="flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-tertiary hover:bg-tertiary-container text-white font-label-lg text-label-lg font-bold disabled:opacity-40"
              >
                <Icon name="check_circle" className="text-base text-white" />
                Setujui
              </button>
              <button
                type="button"
                onClick={() => setMode('reject')}
                className="flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-xl bg-surface-container-lowest hover:bg-error-container text-error font-label-lg text-label-lg font-semibold border border-error/40"
              >
                <Icon name="cancel" className="text-base" />
                Tolak dan kembalikan ke TU
              </button>
            </>
          ) : (
            <>
              <label htmlFor="approval-notes" className="font-label-md text-label-md font-semibold text-on-surface">
                {mode === 'approve' ? 'Catatan persetujuan (opsional)' : 'Alasan penolakan (wajib)'}
              </label>
              <textarea
                id="approval-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={mode === 'approve' ? 'Contoh: Disetujui sesuai SK Panitia.' : 'Contoh: Volume pengawas tidak sesuai jadwal ujian.'}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
              {mode === 'approve' && (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Honor {formatRupiah(honorTotal)} akan dikunci dan dikirim ke Sianggar untuk dicairkan. Keputusan ini tidak dapat dibatalkan dari VAKASI.
                </p>
              )}
              <div className="flex gap-space-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMode('idle');
                    setNotes('');
                  }}
                  className="flex-1 px-space-lg py-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={busy || (mode === 'reject' && notes.trim().length < 5)}
                  onClick={submit}
                  className={cn(
                    'flex-1 px-space-lg py-space-sm rounded-xl text-white font-label-md text-label-md font-bold disabled:opacity-40',
                    mode === 'approve' ? 'bg-tertiary hover:bg-tertiary-container' : 'bg-error hover:opacity-90'
                  )}
                >
                  {busy ? 'Menyimpan...' : mode === 'approve' ? 'Ya, setujui' : 'Kirim penolakan'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
