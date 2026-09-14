'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Icon } from '@/components/ui/icon';
import { ApiError } from '@/lib/api/types';
import { changePassword } from '@/lib/api/auth';

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });

  function close() {
    setForm({ current_password: '', password: '', password_confirmation: '' });
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.password_confirmation) {
      toast.error('Konfirmasi password baru tidak cocok.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(form.current_password, form.password);
      toast.success('Password berhasil diubah.');
      close();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal mengubah password.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-xl max-w-sm w-full p-space-xl border border-outline-variant/40 shadow-xl">
        <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-md">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Ganti Password</h3>
          <button type="button" onClick={close} className="text-on-surface-variant hover:text-on-surface">
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-space-md">
          <div>
            <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
              Password Saat Ini
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.current_password}
              onChange={(e) => setForm({ ...form, current_password: e.target.value })}
              className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
              Password Baru
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-secondary uppercase font-semibold block mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:bg-surface-container-lowest focus:outline-none"
            />
          </div>
          <div className="pt-space-sm flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-white font-label-md text-label-md font-semibold disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
