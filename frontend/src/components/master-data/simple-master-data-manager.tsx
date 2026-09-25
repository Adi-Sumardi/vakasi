'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import {
  createActivityType,
  createFundSource,
  createHonorType,
  createPosition,
  createUnit,
  updateActivityType,
  updateFundSource,
  updateHonorType,
  updatePosition,
  updateUnit,
  deleteMasterData,
  type MasterDataResource,
  type SimpleMasterDataInput,
} from '@/lib/api/master-data';
import { Hint } from '@/components/common/hint';
import { useConfirm } from '@/components/common/confirm-dialog';

const CREATORS = {
  unit: createUnit,
  position: createPosition,
  'activity-type': createActivityType,
  'honor-type': createHonorType,
  'fund-source': createFundSource,
} as const;

const RESOURCES: Record<keyof typeof CREATORS, MasterDataResource> = {
  unit: 'units',
  position: 'positions',
  'activity-type': 'activity-types',
  'honor-type': 'honor-types',
  'fund-source': 'fund-sources',
};

const UPDATERS = {
  unit: updateUnit,
  position: updatePosition,
  'activity-type': updateActivityType,
  'honor-type': updateHonorType,
  'fund-source': updateFundSource,
} as const;

type SimpleEntity = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  unit?: string;
  status: string;
};

type Props = {
  title: string;
  subtitle: string;
  emptyLabel: string;
  addLabel: string;
  items: SimpleEntity[];
  hasDescription?: boolean;
  /** For HonorType's "satuan" (JAM/HARI/PAKET/...) field. */
  extraField?: { key: 'unit'; label: string; placeholder: string };
  kind: keyof typeof CREATORS;
  /** Super Admin may permanently delete a record that is still unused. */
  canDelete?: boolean;
  /** Tabs of a combined master-data page, shown above the title. */
  tabs?: React.ReactNode;
};

type FormState = { code: string; name: string; description: string; unit: string };

const EMPTY_FORM: FormState = { code: '', name: '', description: '', unit: '' };

export function SimpleMasterDataManager({
  title,
  subtitle,
  emptyLabel,
  addLabel,
  items,
  hasDescription,
  extraField,
  kind,
  canDelete = false,
  tabs,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const create = CREATORS[kind] as (input: SimpleMasterDataInput) => Promise<unknown>;
  const update = UPDATERS[kind] as (id: number, input: Partial<SimpleMasterDataInput>) => Promise<unknown>;

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(item: SimpleEntity) {
    setEditingId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      unit: item.unit ?? '',
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload: SimpleMasterDataInput = {
      code: form.code,
      name: form.name,
      description: hasDescription ? form.description || undefined : undefined,
      unit: extraField ? form.unit || undefined : undefined,
    };
    try {
      if (editingId) {
        await update(editingId, payload);
        toast.success(`${title} berhasil diperbarui.`);
      } else {
        await create(payload);
        toast.success(`${title} berhasil ditambahkan.`);
      }
      setOpen(false);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : `Gagal menyimpan ${title.toLowerCase()}.`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: { id: number; name: string }) {
    const ok = await confirm({
      title: `Hapus "${item.name}"?`,
      description: 'Data dihapus permanen. Bila masih dipakai pegawai atau kegiatan, penghapusan akan ditolak; nonaktifkan saja.',
      confirmLabel: 'Hapus permanen',
      tone: 'danger',
    });
    if (!ok) {
      return;
    }
    setBusyId(item.id);
    try {
      await deleteMasterData(RESOURCES[kind], item.id);
      toast.success(`${item.name} dihapus.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menghapus data.');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(item: SimpleEntity) {
    const nextStatus = item.status === 'active' ? 'inactive' : 'active';
    if (
      nextStatus === 'inactive' &&
      !(await confirm({
        title: `Nonaktifkan ${item.name}?`,
        description: 'Data tetap tersimpan, tetapi tidak bisa dipilih lagi sampai diaktifkan kembali.',
        confirmLabel: 'Nonaktifkan',
        tone: 'warning',
      }))
    ) {
      return;
    }
    setBusyId(item.id);
    try {
      await update(item.id, { status: nextStatus });
      toast.success(nextStatus === 'active' ? `${item.name} diaktifkan kembali.` : `${item.name} dinonaktifkan.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal mengubah status.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: 'Data Master' }, { label: title }]}
        title={title}
        description={<>{subtitle}</>}
        actions={
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-gold text-on-gold font-label-lg text-label-lg font-bold shadow-sm hover:brightness-105 transition">
            <Icon name="add" className="text-base" />
            <span>{addLabel}</span>
          </button>
        }
      />
      {tabs}

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">{emptyLabel}</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Kode</th>
                  <th className="px-space-base py-space-sm font-bold">Nama</th>
                  {extraField && <th className="px-space-base py-space-sm font-bold">{extraField.label}</th>}
                  {hasDescription && <th className="px-space-base py-space-sm font-bold">Deskripsi</th>}
                  <th className="px-space-base py-space-sm text-center font-bold">Status</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-space-base py-space-sm font-mono text-outline">{item.code}</td>
                    <td className="px-space-base py-space-sm font-label-md text-label-md font-semibold text-on-surface">{item.name}</td>
                    {extraField && <td className="px-space-base py-space-sm text-on-surface-variant">{item.unit}</td>}
                    {hasDescription && <td className="px-space-base py-space-sm text-on-surface-variant">{item.description || '—'}</td>}
                    <td className="px-space-base py-space-sm text-center">
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-xs font-semibold">
                        {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-space-base py-space-sm">
                      <div className="flex items-center justify-center gap-space-2xs">
                        <Hint label="Edit">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors"
                          >
                            <Icon name="edit" className="text-[18px]" />
                          </button>
                        </Hint>
                        <Hint label={item.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => toggleStatus(item)}
                            className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error-container transition-colors disabled:opacity-50"
                          >
                            <Icon name={item.status === 'active' ? 'block' : 'restart_alt'} className="text-[18px]" />
                          </button>
                        </Hint>
                        {canDelete && (
                          <Hint label="Hapus permanen">
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => handleDelete(item)}
                              className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error-container transition-colors disabled:opacity-50"
                            >
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </Hint>
                        )}
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
                {editingId ? `Edit ${title}` : addLabel}
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-space-md">
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Kode</label>
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm font-mono focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Nama</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>
              {extraField && (
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">{extraField.label}</label>
                  <input
                    required
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder={extraField.placeholder}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                  />
                </div>
              )}
              {hasDescription && (
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Deskripsi (opsional)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                  />
                </div>
              )}
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
