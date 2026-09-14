'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { createUser, updateUser, type AppUser, type Role } from '@/lib/api/users';

type FormState = { name: string; email: string; password: string; role_id: number };

function emptyForm(roles: Role[]): FormState {
  return { name: '', email: '', password: '', role_id: roles[0]?.id ?? 0 };
}

export function UserManager({ users, roles, currentUserId }: { users: AppUser[]; roles: Role[]; currentUserId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(roles));

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(roles));
    setOpen(true);
  }

  function openEdit(user: AppUser) {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, password: '', role_id: user.role?.id ?? roles[0]?.id ?? 0 });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateUser(editingId, {
          name: form.name,
          email: form.email,
          role_id: Number(form.role_id),
          ...(form.password ? { password: form.password } : {}),
        });
        toast.success('Pengguna berhasil diperbarui.');
      } else {
        await createUser({ ...form, role_id: Number(form.role_id) });
        toast.success('Pengguna berhasil dibuat.');
      }
      setOpen(false);
      setForm(emptyForm(roles));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan pengguna.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(user: AppUser) {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    setBusyId(user.id);
    try {
      await updateUser(user.id, { status: nextStatus });
      toast.success(nextStatus === 'active' ? `${user.name} diaktifkan kembali.` : `${user.name} dinonaktifkan.`);
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
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Pengaturan</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola pengguna dan hak akses sistem.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-space-xs px-space-lg py-space-sm bg-primary hover:bg-primary-container text-white rounded-lg font-label-lg text-label-lg shadow-xs transition-all font-semibold"
        >
          <Icon name="person_add" className="text-base text-white" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-space-2xl text-center text-on-surface-variant font-body-md text-body-md">Belum ada pengguna.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-label-sm tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-space-base py-space-sm font-bold">Nama</th>
                  <th className="px-space-base py-space-sm font-bold">Email</th>
                  <th className="px-space-base py-space-sm font-bold">Peran</th>
                  <th className="px-space-base py-space-sm font-bold">Login Terakhir</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Status</th>
                  <th className="px-space-base py-space-sm text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-space-base py-space-sm font-label-md text-label-md font-semibold text-on-surface">
                      {u.name}
                      {u.id === currentUserId && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold uppercase">Anda</span>
                      )}
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant">{u.email}</td>
                    <td className="px-space-base py-space-sm">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                        {u.role?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-space-base py-space-sm text-on-surface-variant font-mono text-xs">{u.last_login_at ?? 'Belum pernah'}</td>
                    <td className="px-space-base py-space-sm text-center">
                      <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-xs font-semibold">
                        {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-space-base py-space-sm">
                      <div className="flex items-center justify-center gap-space-2xs">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          title="Edit"
                          className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors"
                        >
                          <Icon name="edit" className="text-[18px]" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === u.id || u.id === currentUserId}
                          onClick={() => toggleStatus(u)}
                          title={u.id === currentUserId ? 'Tidak dapat menonaktifkan akun sendiri' : (u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan')}
                          className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error-container transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
                        >
                          <Icon name={u.status === 'active' ? 'block' : 'restart_alt'} className="text-[18px]" />
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
                {editingId ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-space-md">
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Nama</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
                  Password {editingId && <span className="normal-case font-normal text-outline">(kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">Peran</label>
                <select
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none"
                >
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
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
