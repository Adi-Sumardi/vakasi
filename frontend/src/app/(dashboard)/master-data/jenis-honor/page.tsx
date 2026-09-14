import { SimpleMasterDataManager } from '@/components/master-data/simple-master-data-manager';
import { listHonorTypes } from '@/lib/api/master-data.server';

export default async function JenisHonorPage() {
  const honorTypes = await listHonorTypes();

  return (
    <SimpleMasterDataManager
      kind="honor-type"
      title="Jenis Honor"
      subtitle="Master data jenis honor beserta satuannya (jam, hari, paket, kegiatan)."
      emptyLabel="Belum ada jenis honor."
      addLabel="Tambah Jenis Honor"
      items={honorTypes}
      hasDescription
      extraField={{ key: 'unit', label: 'Satuan', placeholder: 'JAM / HARI / PAKET / KEGIATAN' }}
    />
  );
}
