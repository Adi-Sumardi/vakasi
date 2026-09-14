import { SimpleMasterDataManager } from '@/components/master-data/simple-master-data-manager';
import { listActivityTypes } from '@/lib/api/master-data.server';

export default async function JenisKegiatanPage() {
  const activityTypes = await listActivityTypes();

  return (
    <SimpleMasterDataManager
      kind="activity-type"
      title="Jenis Kegiatan"
      subtitle="Master data jenis/kategori kegiatan sekolah."
      emptyLabel="Belum ada jenis kegiatan."
      addLabel="Tambah Jenis Kegiatan"
      items={activityTypes}
      hasDescription
    />
  );
}
