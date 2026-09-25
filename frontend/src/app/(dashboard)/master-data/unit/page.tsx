import { PageTabs } from '@/components/common/page-tabs';
import { SimpleMasterDataManager } from '@/components/master-data/simple-master-data-manager';
import { hasPermission } from '@/lib/api/auth';
import { meServer } from '@/lib/api/auth.server';
import { listPositions, listUnits } from '@/lib/api/master-data.server';

/** "Unit & Jabatan": two small lists maintained together. */
export default async function UnitJabatanPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const canDelete = hasPermission(await meServer(), 'master-data.delete');
  const { tab = 'unit' } = await searchParams;
  const tabs = (
    <PageTabs
      active={tab}
      tabs={[
        { key: 'unit', label: 'Unit', href: '/master-data/unit' },
        { key: 'jabatan', label: 'Jabatan', href: '/master-data/unit?tab=jabatan' },
      ]}
    />
  );

  if (tab === 'jabatan') {
    return (
      <SimpleMasterDataManager
        kind="position"
        title="Jabatan"
        subtitle="Jabatan pegawai, dipakai di data pegawai dan kode_jabatan saat import."
        emptyLabel="Belum ada jabatan."
        addLabel="Tambah Jabatan"
        items={await listPositions()}
        canDelete={canDelete}
      tabs={tabs}
      />
    );
  }

  return (
    <SimpleMasterDataManager
      kind="unit"
      title="Unit"
      subtitle="Unit kerja / sekolah. Kode unit dipakai sebagai kode_unit saat import pegawai."
      emptyLabel="Belum ada unit."
      addLabel="Tambah Unit"
      items={await listUnits()}
      canDelete={canDelete}
      tabs={tabs}
    />
  );
}
