import { CreateActivityWizard } from '@/components/kegiatan/create-activity-wizard';
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
      activityTypes={activityTypes}
      units={units}
      fundSources={fundSources}
      honorTypes={honorTypes}
      employees={employees}
    />
  );
}
