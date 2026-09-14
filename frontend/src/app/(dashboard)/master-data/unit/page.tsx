import { SimpleMasterDataManager } from '@/components/master-data/simple-master-data-manager';
import { listUnits } from '@/lib/api/master-data.server';

export default async function UnitPage() {
  const units = await listUnits();

  return (
    <SimpleMasterDataManager
      kind="unit"
      title="Unit"
      subtitle="Master data unit kerja sekolah."
      emptyLabel="Belum ada unit."
      addLabel="Tambah Unit"
      items={units}
    />
  );
}
