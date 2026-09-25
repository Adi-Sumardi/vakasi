'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { CurrencyInput } from '@/components/common/currency-input';
import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { updateActivity, type Activity } from '@/lib/api/activities';
import type { ActivityType, FundSource, Unit } from '@/lib/api/master-data';
import { Hint } from '@/components/common/hint';

type Props = {
  activity: Activity;
  activityTypes: ActivityType[];
  units: Unit[];
  fundSources: FundSource[];
};

export function EditActivityDialog({ activity, activityTypes, units, fundSources }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: activity.name,
    activity_type_id: activity.activity_type.id,
    unit_id: activity.unit.id,
    fund_source_id: activity.fund_source.id,
    start_date: activity.start_date,
    end_date: activity.end_date,
    location: activity.location ?? '',
    budget_amount: activity.budget_amount,
    description: activity.description ?? '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateActivity(activity.id, {
        ...form,
        activity_type_id: Number(form.activity_type_id),
        unit_id: Number(form.unit_id),
        fund_source_id: Number(form.fund_source_id),
        budget_amount: Number(form.budget_amount),
      });
      toast.success('Informasi kegiatan berhasil diperbarui.');
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal memperbarui kegiatan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Hint label="Edit informasi kegiatan">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors"
        >
          <Icon name="edit" className="text-[18px]" />
        </button>
      </Hint>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-xl border border-outline-variant/40 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Edit Informasi Kegiatan</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-space-md">
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Nama Kegiatan</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Jenis Kegiatan</label>
                  <select
                    value={form.activity_type_id}
                    onChange={(e) => setForm({ ...form, activity_type_id: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                  >
                    {activityTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Unit</label>
                  <select
                    value={form.unit_id}
                    onChange={(e) => setForm({ ...form, unit_id: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                  >
                    {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Sumber Dana</label>
                  <select
                    value={form.fund_source_id}
                    onChange={(e) => setForm({ ...form, fund_source_id: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                  >
                    {fundSources.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="edit-budget" className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Anggaran</label>
                  <CurrencyInput id="edit-budget" required value={form.budget_amount} onChange={(v) => setForm({ ...form, budget_amount: v })} className="h-9" />
                </div>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Lokasi (opsional)</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Deskripsi (opsional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                />
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
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
