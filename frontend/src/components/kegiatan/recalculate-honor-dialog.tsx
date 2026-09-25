'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { calculateHonor, removeActivityMember, type Activity } from '@/lib/api/activities';
import type { HonorType } from '@/lib/api/master-data';
import { formatRupiah } from '@/lib/format';
import { Hint } from '@/components/common/hint';
import { useConfirm } from '@/components/common/confirm-dialog';

type Props = {
  activity: Activity;
  honorTypes: HonorType[];
};

type Row = { honor_type_id: number; volume: number };

/**
 * Honor could previously only be calculated inside the creation wizard,
 * so a REJECTED activity could be edited but its honor could never be
 * revised — the revise-and-resubmit loop in FLOW.md section 3 had no UI.
 *
 * A calculation replaces the activity's whole honor set server-side, so
 * this form always submits every member, and removing a member here
 * removes their honor line with them.
 */
export function RecalculateHonorDialog({ activity, honorTypes }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const members = activity.members ?? [];

  const [rows, setRows] = useState<Record<number, Row>>(() =>
    Object.fromEntries(
      members.map((member) => {
        const existing = activity.honor_details?.find((d) => d.activity_member_id === member.id);

        return [
          member.id,
          {
            honor_type_id: existing?.honor_type.id ?? honorTypes[0]?.id ?? 0,
            volume: existing?.volume ?? 1,
          },
        ];
      })
    )
  );

  // Keyed by member, not employee: one employee can hold two roles on
  // the same activity, and each role is paid on its own line.
  function setRow(memberId: number, patch: Partial<Row>) {
    setRows((prev) => ({ ...prev, [memberId]: { ...prev[memberId], ...patch } }));
  }

  const [bulk, setBulk] = useState<Row>({ honor_type_id: honorTypes[0]?.id ?? 0, volume: 1 });

  function applyToAll() {
    setRows(Object.fromEntries(members.map((member) => [member.id, { ...bulk }])));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await calculateHonor(
        activity.id,
        members.map((member) => ({
          activity_member_id: member.id,
          honor_type_id: Number(rows[member.id]?.honor_type_id ?? honorTypes[0]?.id ?? 0),
          volume: Number(rows[member.id]?.volume ?? 1),
        }))
      );
      toast.success(`Honor berhasil dihitung ulang. Total netto ${formatRupiah(result.net_amount)}.`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menghitung ulang honor.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveMember(memberId: number) {
    const member = members.find((m) => m.id === memberId);
    const ok = await confirm({
      title: `Hapus ${member?.employee.name ?? 'peserta'} dari panitia?`,
      description: 'Peserta dan baris honornya ikut dihapus dari kegiatan ini.',
      confirmLabel: 'Hapus peserta',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await removeActivityMember(activity.id, memberId);
      setRows((prev) => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
      toast.success('Peserta dan honornya berhasil dihapus.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menghapus peserta.');
    } finally {
      setBusy(false);
    }
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold border border-outline-variant/30"
      >
        <Icon name="calculate" className="text-[18px]" />
        <span>Hitung Ulang Honor</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-2xl w-full p-space-xl border border-outline-variant/40 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Hitung Ulang Honor</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <Icon name="close" />
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              Perhitungan ini menggantikan seluruh rincian honor kegiatan. Tarif diambil dari master tarif yang
              berlaku pada tanggal mulai kegiatan.
            </p>

            <form onSubmit={handleSubmit} className="space-y-space-md">
              {members.length > 1 && (
                <div className="flex flex-wrap items-end gap-2 p-space-sm rounded-lg border border-dashed border-outline-variant">
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                      Jenis Honor (semua)
                    </label>
                    <select
                      value={bulk.honor_type_id}
                      onChange={(e) => setBulk({ ...bulk, honor_type_id: Number(e.target.value) })}
                      className="w-48 h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                    >
                      {honorTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                      Volume
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={bulk.volume}
                      onChange={(e) => setBulk({ ...bulk, volume: Number(e.target.value) })}
                      className="w-24 h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-body-sm text-body-sm font-mono focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyToAll}
                    className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold border border-outline-variant/30"
                  >
                    Terapkan ke {members.length} peserta
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-space-sm">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:items-end p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30"
                  >
                    <div>
                      <span className="font-label-md text-label-md text-on-surface font-semibold block">
                        {member.employee.name}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{member.role_name}</span>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                        Jenis Honor
                      </label>
                      <select
                        value={rows[member.id]?.honor_type_id ?? ''}
                        onChange={(e) => setRow(member.id, { honor_type_id: Number(e.target.value) })}
                        className="w-full sm:w-48 h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                      >
                        {honorTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                        Volume
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={rows[member.id]?.volume ?? 1}
                        onChange={(e) => setRow(member.id, { volume: Number(e.target.value) })}
                        className="w-full sm:w-24 h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-body-sm text-body-sm font-mono focus:outline-none"
                      />
                    </div>
                    <Hint label="Hapus peserta beserta honornya">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-9 px-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors disabled:opacity-50"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    </Hint>
                  </div>
                ))}
              </div>

              <div className="pt-space-sm flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold disabled:opacity-50"
                >
                  {busy ? 'Menghitung...' : 'Hitung Ulang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
