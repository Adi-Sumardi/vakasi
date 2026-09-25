'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { createEmployee, updateEmployee, updateEmployeeStatus, type Employee } from '@/lib/api/employees';
import type { Position, Unit } from '@/lib/api/master-data';
import { Hint } from '@/components/common/hint';
import { useConfirm } from '@/components/common/confirm-dialog';

const EMPLOYEE_TYPES = [
  { value: 'guru', label: 'Guru' },
  { value: 'tu', label: 'TU' },
  { value: 'tendik', label: 'Tenaga Kependidikan' },
  { value: 'panitia', label: 'Panitia' },
];

const EMPLOYEE_TYPE_LABEL: Record<string, string> = Object.fromEntries(EMPLOYEE_TYPES.map((t) => [t.value, t.label]));

type FormState = {
  employee_code: string;
  name: string;
  nip: string;
  unit_id: number;
  position_id: number;
  employee_type: 'guru' | 'tu' | 'tendik' | 'panitia';
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
};

function emptyForm(units: Unit[], positions: Position[]): FormState {
  return {
    employee_code: '',
    name: '',
    nip: '',
    unit_id: units[0]?.id ?? 0,
    position_id: positions[0]?.id ?? 0,
    employee_type: 'guru',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
  };
}

export function EmployeeManager({
  employees,
  units,
  positions,
  title = 'Pegawai',
  canManage = true,
  toolbar,
  footer,
  editableUnitId = null,
}: {
  employees: Employee[];
  /** Units offered in the form; a unit-bound account passes only its own. */
  units: Unit[];
  positions: Position[];
  title?: string;
  canManage?: boolean;
  /** Search/filter/import controls rendered under the header. */
  toolbar?: React.ReactNode;
  /** Pagination, rendered at the bottom of the table card. */
  footer?: React.ReactNode;
  /** A unit-bound account edits only its own unit's staff. */
  editableUnitId?: number | null;
}) {
  const canEdit = (emp: Employee) => canManage && (editableUnitId === null || emp.unit?.id === editableUnitId);
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(units, positions));

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(units, positions));
    setOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditingId(emp.id);
    setForm({
      employee_code: emp.employee_code,
      name: emp.name,
      nip: emp.nip ?? '',
      unit_id: emp.unit?.id ?? units[0]?.id ?? 0,
      position_id: emp.position?.id ?? positions[0]?.id ?? 0,
      employee_type: emp.employee_type as FormState['employee_type'],
      bank_name: emp.bank_name ?? '',
      bank_account_name: emp.bank_account_name ?? '',
      bank_account_number: emp.bank_account_number ?? '',
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      employee_code: form.employee_code,
      name: form.name,
      nip: form.nip || undefined,
      unit_id: Number(form.unit_id),
      position_id: Number(form.position_id),
      employee_type: form.employee_type,
      bank_name: form.bank_name || undefined,
      bank_account_name: form.bank_account_name || undefined,
      bank_account_number: form.bank_account_number || undefined,
    };
    try {
      if (editingId) {
        await updateEmployee(editingId, payload);
        toast.success('Pegawai berhasil diperbarui.');
      } else {
        await createEmployee(payload);
        toast.success('Pegawai berhasil ditambahkan.');
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan pegawai.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(emp: Employee) {
    const nextStatus = emp.status === 'active' ? 'inactive' : 'active';
    if (
      nextStatus === 'inactive' &&
      !(await confirm({
        title: `Nonaktifkan ${emp.name}?`,
        description: 'Data tetap tersimpan, tetapi tidak bisa dipilih lagi sampai diaktifkan kembali.',
        confirmLabel: 'Nonaktifkan',
        tone: 'warning',
      }))
    ) {
      return;
    }
    setBusyId(emp.id);
    try {
      await updateEmployeeStatus(emp.id, nextStatus);
      toast.success(nextStatus === 'active' ? `${emp.name} diaktifkan kembali.` : `${emp.name} dinonaktifkan.`);
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
        description={<>Master data pegawai — guru, TU, tenaga kependidikan, dan panitia sekolah.</>}
        actions={
          canManage && (
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-gold text-on-gold font-label-lg text-label-lg font-bold shadow-sm hover:brightness-105 transition">
              <Icon name="person_add" className="text-base" />
              <span>Tambah Pegawai</span>
            </button>
          )
        }
      />

      {toolbar}

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {employees.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">
            Belum ada pegawai yang cocok. Tambahkan satu per satu, atau import sekaligus dari file Excel (CSV).
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Kode / Nama</th>
                  <th className="px-space-base py-space-sm font-bold">Unit</th>
                  <th className="px-space-base py-space-sm font-bold">Jabatan</th>
                  <th className="px-space-base py-space-sm font-bold">Jenis</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Status</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-space-base py-space-sm">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">{emp.name}</div>
                      <div className="font-body-sm text-body-sm text-outline font-mono">{emp.employee_code}</div>
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">{emp.unit?.name ?? '—'}</td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">{emp.position?.name ?? '—'}</td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">
                      {EMPLOYEE_TYPE_LABEL[emp.employee_type] ?? emp.employee_type}
                    </td>
                    <td className="px-space-base py-space-sm text-center">
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-xs font-semibold">
                        {emp.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-space-base py-space-sm">
                      {canEdit(emp) && (
                        <div className="flex items-center justify-center gap-space-2xs">
                          <Hint label="Edit">
                            <button
                              type="button"
                              onClick={() => openEdit(emp)}
                              className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors"
                            >
                              <Icon name="edit" className="text-[18px]" />
                            </button>
                          </Hint>
                          <Hint label={emp.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}>
                            <button
                              type="button"
                              disabled={busyId === emp.id}
                              onClick={() => toggleStatus(emp)}
                              className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error-container transition-colors disabled:opacity-50"
                            >
                              <Icon name={emp.status === 'active' ? 'block' : 'restart_alt'} className="text-[18px]" />
                            </button>
                          </Hint>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {footer}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-xl border border-outline-variant/40 shadow-xl">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-md">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {editingId ? 'Edit Pegawai' : 'Tambah Pegawai'}
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-space-md">
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                  Nama Lengkap
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    Kode Pegawai
                  </label>
                  <input
                    required
                    value={form.employee_code}
                    onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                    placeholder="EMP-00123"
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm font-mono focus:bg-surface-container-lowest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    NIP (opsional)
                  </label>
                  <input
                    value={form.nip}
                    onChange={(e) => setForm({ ...form, nip: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm font-mono focus:bg-surface-container-lowest focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Unit</label>
                  <select
                    value={form.unit_id}
                    onChange={(e) => setForm({ ...form, unit_id: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                  >
                    {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    Jabatan
                  </label>
                  <select
                    value={form.position_id}
                    onChange={(e) => setForm({ ...form, position_id: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                  >
                    {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                  Jenis Pegawai
                </label>
                <select
                  value={form.employee_type}
                  onChange={(e) => setForm({ ...form, employee_type: e.target.value as FormState['employee_type'] })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                >
                  {EMPLOYEE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="pt-space-sm border-t border-outline-variant/30">
                <p className="font-label-sm text-label-sm text-secondary uppercase font-semibold mb-space-2xs">
                  Rekening Bank (untuk pembayaran honor)
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
                  Opsional saat ini, tapi jika kosong pembayaran honor pegawai ini tidak dapat diselesaikan nanti.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                      Nama Bank
                    </label>
                    <input
                      value={form.bank_name}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      placeholder="BRI, Mandiri, dsb."
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                      No. Rekening
                    </label>
                    <input
                      value={form.bank_account_number}
                      onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm font-mono focus:bg-surface-container-lowest focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                    Nama Pemilik Rekening
                  </label>
                  <input
                    value={form.bank_account_name}
                    onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
                    placeholder="Sesuai buku tabungan"
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
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
                  {submitting ? 'Menyimpan...' : 'Simpan Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
