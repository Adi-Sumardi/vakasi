import Link from 'next/link';

import { PaginationBar } from '@/components/common/pagination-bar';
import { EmployeeImportDialog } from '@/components/master-data/employee-import-dialog';
import { EmployeeManager } from '@/components/master-data/employee-manager';
import { hasPermission } from '@/lib/api/auth';
import { meServer } from '@/lib/api/auth.server';
import type { Employee } from '@/lib/api/employees';
import { listPositions, listUnits } from '@/lib/api/master-data.server';
import { serverApiFetchPage, toQuery } from '@/lib/api/server';

type Search = { search?: string; unit_id?: string; page?: string };

/**
 * A unit-bound account opens on its own unit's staff (it can still
 * search everyone, since a committee may borrow staff from another
 * school), but only edits its own.
 */
export default async function PegawaiPage({ searchParams }: { searchParams: Promise<Search> }) {
  const me = await meServer();
  const params = await searchParams;
  const scopedUnitId = me.scoped_unit_id ?? null;
  const unitId = params.unit_id ?? (scopedUnitId ? String(scopedUnitId) : '');
  const search = params.search ?? '';
  const canManage = hasPermission(me, 'employees.manage');

  const [list, units, positions] = await Promise.all([
    serverApiFetchPage<Employee>(`/api/v1/employees${toQuery({ search, unit_id: unitId, page: params.page })}`),
    listUnits(),
    listPositions(),
  ]);

  const formUnits = scopedUnitId ? units.filter((u) => u.id === scopedUnitId) : units;

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-space-sm">
      <form action="/master-data/pegawai" className="flex flex-wrap items-center gap-space-xs">
        <select
          name="unit_id"
          defaultValue={unitId}
          aria-label="Filter unit"
          className="h-9 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-body-sm text-body-sm"
        >
          <option value="">Semua unit</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input
          name="search"
          defaultValue={search}
          placeholder="Cari nama atau kode..."
          aria-label="Cari pegawai"
          className="h-9 w-56 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-body-sm text-body-sm"
        />
        <button type="submit" className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 font-label-md text-label-md font-semibold">
          Terapkan
        </button>
        {(search || params.unit_id !== undefined) && (
          <Link href="/master-data/pegawai" className="h-9 px-3 inline-flex items-center rounded-lg text-on-surface-variant hover:bg-surface-container font-label-md text-label-md">
            Reset
          </Link>
        )}
      </form>
      {canManage && <EmployeeImportDialog />}
    </div>
  );

  return (
    <EmployeeManager
      employees={list.data}
      units={formUnits}
      positions={positions}
      title={scopedUnitId ? 'Pegawai Unit' : 'Pegawai'}
      canManage={canManage}
      editableUnitId={scopedUnitId}
      toolbar={toolbar}
      footer={<PaginationBar meta={list.meta} basePath="/master-data/pegawai" params={{ search: search || undefined, unit_id: unitId || undefined }} />}
    />
  );
}
