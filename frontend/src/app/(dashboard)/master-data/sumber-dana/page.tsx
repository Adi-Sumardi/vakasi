import { SimpleMasterDataManager } from '@/components/master-data/simple-master-data-manager';
import { listFundSources } from '@/lib/api/master-data.server';

export default async function SumberDanaPage() {
  const fundSources = await listFundSources();

  return (
    <SimpleMasterDataManager
      kind="fund-source"
      title="Sumber Dana"
      subtitle="Master data sumber dana kegiatan (BOS, Komite, dsb)."
      emptyLabel="Belum ada sumber dana."
      addLabel="Tambah Sumber Dana"
      items={fundSources}
      hasDescription
    />
  );
}
