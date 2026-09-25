import { PageTabs } from '@/components/common/page-tabs';
import { HonorRateManager } from '@/components/master-data/honor-rate-manager';
import { SimpleMasterDataManager } from '@/components/master-data/simple-master-data-manager';
import { hasPermission } from '@/lib/api/auth';
import { meServer } from '@/lib/api/auth.server';
import { listHonorRates, listHonorTypes, listUnits } from '@/lib/api/master-data.server';

/**
 * "Honor & Tarif": a tariff cannot exist without its honor type, so the
 * two are maintained on one page. Roles that may only read the tariff
 * (TU) get the tariff table alone, without edit controls.
 */
export default async function HonorTarifPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const me = await meServer();
  const canManage = hasPermission(me, 'honor-rates.manage');
  const canDelete = hasPermission(me, 'master-data.delete');
  const { tab = 'tarif' } = await searchParams;

  const tabs = canManage ? (
    <PageTabs
      active={tab}
      tabs={[
        { key: 'tarif', label: 'Tarif & SK', href: '/master-data/honor' },
        { key: 'jenis', label: 'Jenis Honor', href: '/master-data/honor?tab=jenis' },
      ]}
    />
  ) : null;

  if (canManage && tab === 'jenis') {
    return (
      <SimpleMasterDataManager
        kind="honor-type"
        title="Jenis Honor"
        subtitle="Jenis honor beserta satuannya (jam, hari, paket, kegiatan)."
        emptyLabel="Belum ada jenis honor."
        addLabel="Tambah Jenis Honor"
        items={await listHonorTypes()}
        hasDescription
        extraField={{ key: 'unit', label: 'Satuan', placeholder: 'JAM / HARI / PAKET / KEGIATAN' }}
        canDelete={canDelete}
        tabs={tabs}
      />
    );
  }

  const [rates, honorTypes, units] = await Promise.all([listHonorRates(), listHonorTypes(), listUnits()]);

  return <HonorRateManager rates={rates} honorTypes={honorTypes} units={units} canManage={canManage} canDelete={canDelete} tabs={tabs} />;
}
