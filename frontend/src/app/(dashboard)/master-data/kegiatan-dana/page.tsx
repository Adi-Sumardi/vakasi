import { PageTabs } from '@/components/common/page-tabs';
import { SimpleMasterDataManager } from '@/components/master-data/simple-master-data-manager';
import { hasPermission } from '@/lib/api/auth';
import { meServer } from '@/lib/api/auth.server';
import { listActivityTypes, listFundSources } from '@/lib/api/master-data.server';

/** "Jenis Kegiatan & Sumber Dana": the two lookups picked when raising an activity. */
export default async function KegiatanDanaPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const canDelete = hasPermission(await meServer(), 'master-data.delete');
  const { tab = 'jenis' } = await searchParams;
  const tabs = (
    <PageTabs
      active={tab}
      tabs={[
        { key: 'jenis', label: 'Jenis Kegiatan', href: '/master-data/kegiatan-dana' },
        { key: 'dana', label: 'Sumber Dana', href: '/master-data/kegiatan-dana?tab=dana' },
      ]}
    />
  );

  if (tab === 'dana') {
    return (
      <SimpleMasterDataManager
        kind="fund-source"
        title="Sumber Dana"
        subtitle="Sumber dana kegiatan (BOS, Komite, Yayasan, dsb.)."
        emptyLabel="Belum ada sumber dana."
        addLabel="Tambah Sumber Dana"
        items={await listFundSources()}
        hasDescription
        canDelete={canDelete}
      tabs={tabs}
      />
    );
  }

  return (
    <SimpleMasterDataManager
      kind="activity-type"
      title="Jenis Kegiatan"
      subtitle="Jenis atau kategori kegiatan sekolah."
      emptyLabel="Belum ada jenis kegiatan."
      addLabel="Tambah Jenis Kegiatan"
      items={await listActivityTypes()}
      hasDescription
      canDelete={canDelete}
      tabs={tabs}
    />
  );
}
