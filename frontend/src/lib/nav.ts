/**
 * Main navigation structure per UI_UX.md section 2. Each item's
 * `permission` gates visibility client-side for UX only — the API
 * itself enforces the real authorization (ROLE_PERMISSION.md 7.2).
 */
export type NavItem = {
  label: string;
  href: string;
  permission: string;
  icon?: string;
  badge?: string | number;
};

export type NavGroup = {
  label: string;
  icon?: string;
  items: NavItem[];
};

export const NAV_DASHBOARD: NavItem = {
  label: 'Dashboard',
  href: '/',
  permission: 'dashboard.view',
  icon: 'grid_view',
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Master Data',
    icon: 'database',
    items: [
      { label: 'Pegawai', href: '/master-data/pegawai', permission: 'employees.view', icon: 'badge' },
      { label: 'Jabatan', href: '/master-data/jabatan', permission: 'employees.manage', icon: 'corporate_fare' },
      { label: 'Unit', href: '/master-data/unit', permission: 'employees.manage', icon: 'domain' },
      { label: 'Jenis Kegiatan', href: '/master-data/jenis-kegiatan', permission: 'activities.create', icon: 'event_note' },
      { label: 'Jenis Honor', href: '/master-data/jenis-honor', permission: 'honor-rates.manage', icon: 'payments' },
      { label: 'Tarif Honor', href: '/master-data/tarif-honor', permission: 'honor-rates.manage', icon: 'price_change' },
      { label: 'Sumber Dana', href: '/master-data/sumber-dana', permission: 'budget.manage', icon: 'account_balance' },
    ],
  },
  {
    label: 'Kegiatan',
    icon: 'event_available',
    items: [
      { label: 'Semua Kegiatan', href: '/kegiatan', permission: 'activities.view', icon: 'calendar_month' },
      { label: 'Buat Kegiatan', href: '/kegiatan/buat', permission: 'activities.create', icon: 'add_circle' },
      { label: 'Menunggu Approval', href: '/kegiatan/approval', permission: 'activities.approve', icon: 'hourglass_top', badge: 4 },
      { label: 'Selesai', href: '/kegiatan?status=completed', permission: 'activities.view', icon: 'task_alt' },
    ],
  },
  {
    label: 'Honor',
    icon: 'payments',
    items: [
      { label: 'Rekap Honor', href: '/honor', permission: 'honors.calculate', icon: 'receipt_long' },
      { label: 'Slip Honor', href: '/honor/slip', permission: 'documents.view', icon: 'description' },
    ],
  },
  {
    label: 'Keuangan',
    icon: 'account_balance_wallet',
    items: [
      { label: 'Anggaran', href: '/keuangan/anggaran', permission: 'budget.view', icon: 'account_balance_wallet' },
      { label: 'Pembayaran', href: '/keuangan/pembayaran', permission: 'payments.view', icon: 'price_check' },
    ],
  },
];

export const NAV_FOOTER: NavItem[] = [
  { label: 'Laporan', href: '/laporan', permission: 'reports.view', icon: 'description' },
  { label: 'Dokumen', href: '/dokumen', permission: 'documents.view', icon: 'folder_open' },
  { label: 'Audit Trail', href: '/audit', permission: 'audit.view', icon: 'receipt_long' },
  { label: 'Pengaturan', href: '/pengaturan', permission: 'users.manage', icon: 'settings' },
];
