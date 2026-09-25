'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { ROLE_LABEL } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/types';
import { updateRolePermissions, type RolePermissions } from '@/lib/api/users';
import { cn } from '@/lib/utils';

const MODULE_LABEL: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Pegawai',
  activities: 'Kegiatan',
  'honor-rates': 'Jenis & Tarif Honor',
  honors: 'Perhitungan Honor',
  'my-honors': 'Honor Saya',
  budget: 'Anggaran',
  payments: 'Pembayaran (nonaktif)',
  reports: 'Laporan',
  documents: 'Dokumen',
  integration: 'Integrasi Sianggar',
  audit: 'Audit Trail',
  users: 'Pengguna',
  'master-data': 'Unit, Jabatan, Jenis Kegiatan, Sumber Dana',
  roles: 'Role & Hak Akses',
};

const ACTION_LABEL: Record<string, string> = {
  view: 'Lihat',
  manage: 'Kelola',
  create: 'Buat',
  update: 'Ubah',
  submit: 'Ajukan',
  approve: 'Setujui',
  calculate: 'Hitung',
  process: 'Proses',
};

/**
 * Roles as columns, permissions as rows grouped by module. Each role is
 * saved on its own, so an accidental click on one column never changes
 * another. Super Admin always holds everything and is shown locked.
 */
export function RolePermissionMatrix({ data }: { data: RolePermissions }) {
  const router = useRouter();
  const [grants, setGrants] = useState<Record<number, Set<string>>>(() =>
    Object.fromEntries(data.roles.map((r) => [r.id, new Set(r.permissions)]))
  );
  const [savingId, setSavingId] = useState<number | null>(null);

  const modules = useMemo(() => {
    const grouped = new Map<string, RolePermissions['permissions']>();
    for (const p of data.permissions) {
      grouped.set(p.module, [...(grouped.get(p.module) ?? []), p]);
    }
    return [...grouped.entries()];
  }, [data.permissions]);

  const dirty = (roleId: number) => {
    const original = new Set(data.roles.find((r) => r.id === roleId)?.permissions ?? []);
    const current = grants[roleId];
    return original.size !== current.size || [...current].some((p) => !original.has(p));
  };

  function toggle(roleId: number, permission: string) {
    setGrants((prev) => {
      const next = new Set(prev[roleId]);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return { ...prev, [roleId]: next };
    });
  }

  async function save(roleId: number) {
    setSavingId(roleId);
    try {
      await updateRolePermissions(roleId, [...grants[roleId]]);
      toast.success('Hak akses tersimpan. Berlaku saat pengguna memuat ulang halaman.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan hak akses.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="p-space-base sm:p-space-xl pb-space-3xl flex flex-col w-full min-h-screen gap-space-lg">
      <PageHeader
        breadcrumb={[{ label: 'Sistem' }, { label: 'Role & Hak Akses' }]}
        title="Role & Hak Akses"
        description="Centang apa yang boleh dilakukan setiap peran, lalu simpan per kolom. Hak akses Super Admin tidak dapat diubah."
      />

      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-x-auto">
        <table className="w-full text-left font-body-sm text-body-sm border-collapse">
          <thead className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30 sticky top-0">
            <tr>
              <th className="px-space-base py-space-sm font-label-sm text-label-sm uppercase font-bold">Hak akses</th>
              {data.roles.map((r) => (
                <th key={r.id} className="px-space-sm py-space-sm text-center align-bottom min-w-24">
                  <div className="font-label-md text-label-md font-bold text-on-surface">{ROLE_LABEL[r.name] ?? r.name}</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant tabular-nums">{r.users_count} akun</div>
                  {r.name !== 'super_admin' && (
                    <button
                      type="button"
                      disabled={!dirty(r.id) || savingId === r.id}
                      onClick={() => save(r.id)}
                      className="mt-space-2xs px-2 py-1 rounded-md bg-primary text-white font-label-sm text-label-sm font-semibold disabled:opacity-30"
                    >
                      {savingId === r.id ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map(([module, permissions]) => (
              <ModuleRows
                key={module}
                module={module}
                permissions={permissions}
                roles={data.roles}
                grants={grants}
                onToggle={toggle}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModuleRows({
  module,
  permissions,
  roles,
  grants,
  onToggle,
}: {
  module: string;
  permissions: RolePermissions['permissions'];
  roles: RolePermissions['roles'];
  grants: Record<number, Set<string>>;
  onToggle: (roleId: number, permission: string) => void;
}) {
  return (
    <>
      <tr className="bg-surface-container-low/60">
        <td colSpan={roles.length + 1} className="px-space-base py-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
          {MODULE_LABEL[module] ?? module}
        </td>
      </tr>
      {permissions.map((p) => (
        <tr key={p.name} className="border-b border-surface-container-low">
          <td className="px-space-base py-space-xs text-on-surface">
            {ACTION_LABEL[p.action] ?? p.action}
            <span className="ml-2 font-mono text-xs text-outline">{p.name}</span>
          </td>
          {roles.map((r) => {
            const locked = r.name === 'super_admin';
            const checked = locked || grants[r.id].has(p.name);
            return (
              <td key={r.id} className="px-space-sm py-space-xs text-center">
                <input
                  type="checkbox"
                  aria-label={`${ROLE_LABEL[r.name] ?? r.name}: ${p.name}`}
                  checked={checked}
                  disabled={locked}
                  onChange={() => onToggle(r.id, p.name)}
                  className={cn('h-4 w-4 accent-primary', locked && 'opacity-50')}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
