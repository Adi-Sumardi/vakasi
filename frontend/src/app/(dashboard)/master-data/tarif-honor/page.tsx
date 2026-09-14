import { listHonorRates, listHonorTypes, listUnits } from '@/lib/api/master-data.server';
import { HonorRateManager } from '@/components/master-data/honor-rate-manager';

export default async function TarifHonorPage() {
  const [rates, honorTypes, units] = await Promise.all([listHonorRates(), listHonorTypes(), listUnits()]);

  return <HonorRateManager rates={rates} honorTypes={honorTypes} units={units} />;
}
