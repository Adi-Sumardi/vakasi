'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { createHonorRate, updateHonorRate, type HonorRate, type HonorType, type Unit } from '@/lib/api/master-data';
import { formatRupiah } from '@/lib/format';

type FormState = {
  honor_type_id: number;
  unit_id: number | '';
  rate: number;
  effective_from: string;
  effective_to: string;
};

function emptyForm(honorTypes: HonorType[]): FormState {
  return {
    honor_type_id: honorTypes[0]?.id ?? 0,
    unit_id: '',
    rate: 25000,
    effective_from: new Date().toISOString().slice(0, 10),
    effective_to: '',
  };
}

export function HonorRateManager({ rates, honorTypes, units }: { rates: HonorRate[]; honorTypes: HonorType[]; units: Unit[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(honorTypes));

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(honorTypes));
    setOpen(true);
  }

  function openEdit(rate: HonorRate) {
    setEditingId(rate.id);
    setForm({
      honor_type_id: rate.honor_type.id,
      unit_id: rate.unit?.id ?? '',
      rate: rate.rate,
      effective_from: rate.effective_from,
      effective_to: rate.effective_to ?? '',
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      honor_type_id: Number(form.honor_type_id),
      unit_id: form.unit_id === '' ? undefined : Number(form.unit_id),
      rate: Number(form.rate),
      effective_from: form.effective_from,
      effective_to: form.effective_to || undefined,
    };
    try {
      if (editingId) {
        await updateHonorRate(editingId, payload);
        toast.success('Tarif honor berhasil diperbarui.');
      } else {
        await createHonorRate(payload);
        toast.success('Tarif honor berhasil ditambahkan.');
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan tarif honor.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(rate: HonorRate) {
    const nextStatus = rate.status === 'active' ? 'inactive' : 'active';
    setBusyId(rate.id);
    try {
      await updateHonorRate(rate.id, { status: nextStatus });
      toast.success(nextStatus === 'active' ? 'Tarif diaktifkan kembali.' : 'Tarif dinonaktifkan.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal mengubah status.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Tarif Honor</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Tarif per jenis honor, berlaku sesuai periode. Perubahan tarif tidak mengubah honor yang sudah dihitung.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-space-xs px-space-lg py-space-sm bg-primary hover:bg-primary-container text-white rounded-lg font-label-lg text-label-lg shadow-xs transition-all font-semibold self-start"
        >
          <Icon name="add" className="text-base text-white" />
          <span>Tambah Tarif Honor</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {rates.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">Belum ada tarif honor.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Jenis Honor</th>
                  <th className="px-space-base py-space-sm font-bold">Unit</th>
                  <th className="px-space-base py-space-sm text-right font-bold">Tarif</th>
                  <th className="px-space-base py-space-sm font-bold">Berlaku</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Status</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {rates.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-space-base py-space-sm font-label-md text-label-md font-semibold text-on-surface">
                      {r.honor_type.name} <span className="text-outline font-normal">/ {r.honor_type.unit}</span>
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">{r.unit?.name ?? 'Semua Unit'}</td>
                    <td className="px-space-base py-space-sm text-right font-currency-cell text-currency-cell">{formatRupiah(r.rate)}</td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">
                      {r.effective_from}{r.effective_to ? ` - ${r.effective_to}` : ' - sekarang'}
                    </td>
                    <td className="px-space-base py-space-sm text-center">
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-xs font-semibold">
                        {r.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-space-base py-space-sm">
                      <div className="flex items-center justify-center gap-space-2xs">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          title="Edit"
                          className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors"
                        >
                          <Icon name="edit" className="text-[18px]" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => toggleStatus(r)}
                          title={r.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                          className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error-container transition-colors disabled:opacity-50"
                        >
                          <Icon name={r.status === 'active' ? 'block' : 'restart_alt'} className="text-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-xl border border-outline-variant/40 shadow-xl">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {editingId ? 'Edit Tarif Honor' : 'Tambah Tarif Honor'}
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-space-md">
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Jenis Honor</label>
                <select
                  value={form.honor_type_id}
                  onChange={(e) => setForm({ ...form, honor_type_id: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                >
                  {honorTypes.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                  Unit (opsional — kosongkan untuk berlaku semua unit)
                </label>
                <select
                  value={form.unit_id}
                  onChange={(e) => setForm({ ...form, unit_id: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                >
                  <option value="">Semua Unit</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Tarif (Rp)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm font-mono focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Berlaku Sejak</label>
                  <input
                    type="date"
                    required
                    value={form.effective_from}
                    onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Sampai (opsional)</label>
                  <input
                    type="date"
                    value={form.effective_to}
                    onChange={(e) => setForm({ ...form, effective_to: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                  />
                </div>
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
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
