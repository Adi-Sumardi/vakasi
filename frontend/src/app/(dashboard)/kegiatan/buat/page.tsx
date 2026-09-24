import { CreateActivityWizard } from '@/components/kegiatan/create-activity-wizard';
import { activeOnly } from '@/lib/api/master-data';
import { listActivityTypes, listFundSources, listHonorTypes, listUnits } from '@/lib/api/master-data.server';
import { listEmployeesServer } from '@/lib/api/employees.server';

export default async function BuatKegiatanPage() {
  const [activityTypes, units, fundSources, honorTypes, employees] = await Promise.all([
    listActivityTypes(),
    listUnits(),
    listFundSources(),
    listHonorTypes(),
    listEmployeesServer(),
  ]);

  return (
    <CreateActivityWizard
      activityTypes={activeOnly(activityTypes)}
      units={activeOnly(units)}
      fundSources={activeOnly(fundSources)}
      honorTypes={activeOnly(honorTypes)}
      employees={activeOnly(employees)}
    />
  );
}
