'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { CurrencyInput } from '@/components/common/currency-input';
import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import {
  createHonorRate,
  deleteMasterData,
  honorRateDecreeUrl,
  updateHonorRate,
  uploadHonorRateDecree,
  type HonorRate,
  type HonorType,
  type Unit,
} from '@/lib/api/master-data';
import { formatRupiah } from '@/lib/format';
import { Hint } from '@/components/common/hint';
import { useConfirm } from '@/components/common/confirm-dialog';

type FormState = {
  honor_type_id: number;
  unit_id: number | '';
  rate: number;
  decree_number: string;
  decree_date: string;
  effective_from: string;
  effective_to: string;
};

function emptyForm(honorTypes: HonorType[]): FormState {
  return {
    honor_type_id: honorTypes[0]?.id ?? 0,
    unit_id: '',
    rate: 25000,
    decree_number: '',
    decree_date: '',
    effective_from: new Date().toISOString().slice(0, 10),
    effective_to: '',
  };
}

export function HonorRateManager({
  rates,
  honorTypes,
  units,
  canManage = true,
  canDelete = false,
  tabs,
}: {
  rates: HonorRate[];
  honorTypes: HonorType[];
  units: Unit[];
  /** False for roles that may only read the tariff (e.g. TU). */
  canManage?: boolean;
  /** Super Admin may permanently delete a tariff no honor was calculated with. */
  canDelete?: boolean;
  tabs?: React.ReactNode;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(honorTypes));
  const [decreeFile, setDecreeFile] = useState<File | null>(null);
  const uploadTarget = useRef<number | null>(null);
  const rowFileInput = useRef<HTMLInputElement>(null);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(honorTypes));
    setDecreeFile(null);
    setOpen(true);
  }

  function openEdit(rate: HonorRate) {
    setEditingId(rate.id);
    setForm({
      honor_type_id: rate.honor_type.id,
      unit_id: rate.unit?.id ?? '',
      rate: rate.rate,
      decree_number: rate.decree_number ?? '',
      decree_date: rate.decree_date ?? '',
      effective_from: rate.effective_from,
      effective_to: rate.effective_to ?? '',
    });
    setDecreeFile(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      honor_type_id: Number(form.honor_type_id),
      unit_id: form.unit_id === '' ? undefined : Number(form.unit_id),
      rate: Number(form.rate),
      decree_number: form.decree_number.trim(),
      decree_date: form.decree_date || undefined,
      effective_from: form.effective_from,
      effective_to: form.effective_to || undefined,
    };
    try {
      const saved = editingId ? await updateHonorRate(editingId, payload) : await createHonorRate(payload);
      if (decreeFile) {
        await uploadHonorRateDecree(saved.id, decreeFile);
      }
      toast.success(editingId ? 'Tarif honor berhasil diperbarui.' : 'Tarif honor berhasil ditambahkan.');
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan tarif honor.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: HonorRate) {
    const ok = await confirm({
      title: `Hapus tarif ${item.honor_type.name}?`,
      description: `Tarif ${formatRupiah(item.rate)} dihapus permanen. Bila sudah dipakai menghitung honor, penghapusan akan ditolak; nonaktifkan saja.`,
      confirmLabel: 'Hapus permanen',
      tone: 'danger',
    });
    if (!ok) {
      return;
    }
    setBusyId(item.id);
    try {
      await deleteMasterData('honor-rates', item.id);
      toast.success('Tarif honor dihapus.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menghapus data.');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(rate: HonorRate) {
    const nextStatus = rate.status === 'active' ? 'inactive' : 'active';
    if (
      nextStatus === 'inactive' &&
      !(await confirm({
        title: `Nonaktifkan tarif ${rate.honor_type.name}?`,
        description: 'Tarif ini tidak dipakai lagi untuk menghitung honor baru. Honor yang sudah dihitung tidak berubah.',
        confirmLabel: 'Nonaktifkan',
        tone: 'warning',
      }))
    ) {
      return;
    }
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

  async function handleRowUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = uploadTarget.current;
    if (!file || !id) return;
    setBusyId(id);
    try {
      await uploadHonorRateDecree(id, file);
      toast.success('Berkas SK tarif berhasil diunggah.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal mengunggah berkas SK.');
    } finally {
      setBusyId(null);
      if (rowFileInput.current) rowFileInput.current.value = '';
    }
  }

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <input
        ref={rowFileInput}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={handleRowUpload}
        className="hidden"
      />
      <PageHeader
        breadcrumb={[{ label: 'Data Master' }, { label: 'Honor & Tarif' }]}
        title="Tarif Honor"
        description={<>Tarif per jenis honor sesuai SK Yayasan yang berlaku. Perubahan tarif tidak mengubah honor yang sudah dihitung.</>}
        actions={
          canManage && (
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-gold text-on-gold font-label-lg text-label-lg font-bold shadow-sm hover:brightness-105 transition">
              <Icon name="add" className="text-base" />
              <span>Tambah Tarif Honor</span>
            </button>
          )
        }
      />
      {tabs}

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
                  <th className="px-space-base py-space-sm font-bold">Dasar SK</th>
                  <th className="px-space-base py-space-sm font-bold">Berlaku</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Status</th>
                  {canManage && <th className="px-space-base py-space-sm text-center font-bold">Aksi</th>}
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
                    <td className="px-space-base py-space-sm">
                      {r.decree_number ? (
                        <div className="text-on-surface">{r.decree_number}</div>
                      ) : (
                        <div className="text-error text-xs font-semibold">Belum ada nomor SK</div>
                      )}
                      {r.has_decree_file ? (
                        <a
                          href={honorRateDecreeUrl(r.id)}
                          target="_blank"
                          rel="noopener"
                          className="text-primary text-xs hover:underline"
                        >
                          {r.decree_file_name ?? 'Lihat berkas SK'}
                        </a>
                      ) : (
                        <div className="text-outline text-xs">Berkas SK belum diunggah</div>
                      )}
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">
                      {r.effective_from}{r.effective_to ? ` - ${r.effective_to}` : ' - sekarang'}
                    </td>
                    <td className="px-space-base py-space-sm text-center">
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-xs font-semibold">
                        {r.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-space-base py-space-sm">
                        <div className="flex items-center justify-center gap-space-2xs">
                          <Hint label="Edit">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors"
                            >
                              <Icon name="edit" className="text-[18px]" />
                            </button>
                          </Hint>
                          <Hint label="Unggah berkas SK tarif">
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => {
                                uploadTarget.current = r.id;
                                rowFileInput.current?.click();
                              }}
                              className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors disabled:opacity-50"
                            >
                              <Icon name="upload_file" className="text-[18px]" />
                            </button>
                          </Hint>
                          <Hint label={r.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => toggleStatus(r)}
                              className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error-container transition-colors disabled:opacity-50"
                            >
                              <Icon name={r.status === 'active' ? 'block' : 'restart_alt'} className="text-[18px]" />
                            </button>
                          </Hint>
                          {canDelete && (
                            <Hint label="Hapus permanen">
                              <button
                                type="button"
                                disabled={busyId === r.id}
                                onClick={() => handleDelete(r)}
                                className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error-container transition-colors disabled:opacity-50"
                              >
                                <Icon name="delete" className="text-[18px]" />
                              </button>
                            </Hint>
                          )}
                        </div>
                      </td>
                    )}
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
                <label htmlFor="rate-amount" className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Tarif</label>
                <CurrencyInput id="rate-amount" required value={form.rate} onChange={(v) => setForm({ ...form, rate: v })} className="h-9" />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Nomor SK Yayasan</label>
                  <input
                    required
                    value={form.decree_number}
                    onChange={(e) => setForm({ ...form, decree_number: e.target.value })}
                    placeholder="Contoh: 012/SK/YAPI/VII/2026"
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Tanggal SK</label>
                  <input
                    type="date"
                    value={form.decree_date}
                    onChange={(e) => setForm({ ...form, decree_date: e.target.value })}
                    className="h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                  Berkas SK (PDF/JPG/PNG, opsional — bisa diunggah nanti)
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => setDecreeFile(e.target.files?.[0] ?? null)}
                  className="w-full font-body-sm text-body-sm text-on-surface"
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
