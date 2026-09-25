import type { AuthUser } from '@/lib/api/auth';

/**
 * Sidebar per the menu redesign: one menu per job, grouped by what the
 * person does rather than by database table. Visibility follows the
 * user's permissions (the API still enforces the real authorization,
 * ROLE_PERMISSION.md 7.2); role and unit only change labels and which
 * group a shared page sits in.
 */
export type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** Hint under the label, e.g. which tabs the page has. */
  hint?: string;
  /** Other paths that should highlight this item. */
  matches?: string[];
};

export type NavGroup = {
  label: string | null;
  items: NavItem[];
};

export function buildNav(user: AuthUser): NavGroup[] {
  const can = (permission: string) => user.permissions.includes(permission);
  const role = user.role?.name ?? '';
  const isGuru = role === 'guru_tendik';
  const isTu = role === 'tu';
  const scoped = !!user.scoped_unit_id;

  const groups: NavGroup[] = [
    {
      label: null,
      items: can('dashboard.view') ? [{ label: 'Dashboard', href: '/', icon: 'grid_view' }] : [],
    },
    {
      label: 'Kegiatan',
      items: [
        can('activities.view') && !isGuru && {
          label: scoped ? 'Kegiatan Unit' : 'Kegiatan',
          href: '/kegiatan',
          icon: 'calendar_month',
          matches: ['/kegiatan/buat'],
        },
        can('activities.approve') && { label: 'Menunggu Approval', href: '/kegiatan/approval', icon: 'hourglass_top' },
        can('activities.view') && !isGuru && { label: 'Status Pencairan', href: '/pencairan', icon: 'send' },
        can('my-honors.view') && { label: 'Honor Saya', href: '/honor-saya', icon: 'payments' },
      ].filter(Boolean) as NavItem[],
    },
    {
      label: isTu ? 'Honor' : 'Honor & Anggaran',
      items: [
        can('reports.view') && !isGuru && { label: scoped ? 'Rekap Honor Unit' : 'Rekap Honor', href: '/honor', icon: 'receipt_long' },
        can('reports.view') && !isGuru && !isTu && { label: 'Anggaran', href: '/keuangan/anggaran', icon: 'account_balance_wallet' },
        can('reports.view') && !isGuru && { label: scoped ? 'Laporan Unit' : 'Laporan & Export', href: '/laporan', icon: 'bar_chart' },
        can('documents.view') && !isGuru && !isTu && { label: 'Arsip Dokumen', href: '/dokumen', icon: 'folder_open' },
      ].filter(Boolean) as NavItem[],
    },
  ];

  const managesMaster = can('master-data.manage') || can('honor-rates.manage');

  if (managesMaster) {
    groups.push({
      label: 'Data Master',
      items: [
        can('employees.view') && { label: 'Pegawai', href: '/master-data/pegawai', icon: 'badge' },
        can('master-data.manage') && { label: 'Unit & Jabatan', href: '/master-data/unit', icon: 'domain' },
        can('honor-rates.manage') && { label: 'Honor & Tarif', href: '/master-data/honor', icon: 'price_change' },
        can('master-data.manage') && { label: 'Jenis Kegiatan & Dana', href: '/master-data/kegiatan-dana', icon: 'event_note' },
      ].filter(Boolean) as NavItem[],
    });
  } else if (!isGuru) {
    groups.push({
      label: 'Referensi',
      items: [
        can('employees.view') && { label: scoped ? 'Pegawai Unit' : 'Pegawai', href: '/master-data/pegawai', icon: 'badge' },
        can('honor-rates.view') && { label: 'Tarif Honor', href: '/master-data/honor', icon: 'price_change' },
      ].filter(Boolean) as NavItem[],
    });
  }

  groups.push({
    label: 'Sistem',
    items: [
      can('users.manage') && { label: 'Pengguna', href: '/pengaturan', icon: 'person' },
      can('roles.manage') && { label: 'Role & Hak Akses', href: '/pengaturan/role', icon: 'shield_check' },
      can('integration.manage') && { label: 'Integrasi Sianggar', href: '/integrasi/sianggar', icon: 'cloud_upload' },
      can('audit.view') && { label: 'Audit Trail', href: '/audit', icon: 'history' },
    ].filter(Boolean) as NavItem[],
  });

  return groups.filter((group) => group.items.length > 0);
}

/**
 * The item a path belongs to: the longest matching href wins, so
 * /kegiatan/approval highlights "Menunggu Approval", not "Kegiatan",
 * while /kegiatan/42 still highlights "Kegiatan".
 */
export function activeHref(groups: NavGroup[], pathname: string): string | null {
  let best: { href: string; length: number } | null = null;

  for (const item of groups.flatMap((g) => g.items)) {
    for (const path of [item.href, ...(item.matches ?? [])]) {
      const hit = path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);

      if (hit && (best === null || path.length > best.length)) {
        best = { href: item.href, length: path.length };
      }
    }
  }

  return best?.href ?? null;
}
