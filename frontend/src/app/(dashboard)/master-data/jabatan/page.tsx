import { SimpleMasterDataManager } from '@/components/master-data/simple-master-data-manager';
import { listPositions } from '@/lib/api/master-data.server';

export default async function JabatanPage() {
  const positions = await listPositions();

  return (
    <SimpleMasterDataManager
      kind="position"
      title="Jabatan"
      subtitle="Master data jabatan pegawai sekolah."
      emptyLabel="Belum ada jabatan."
      addLabel="Tambah Jabatan"
      items={positions}
    />
  );
}
