import { CreateActivityWizard } from '@/components/kegiatan/create-activity-wizard';
import { meServer } from '@/lib/api/auth.server';
import { listActiveEmployeesServer } from '@/lib/api/employees.server';
import { activeOnly } from '@/lib/api/master-data';
import { listActivityTypes, listFundSources, listHonorTypes, listUnits } from '@/lib/api/master-data.server';

export default async function BuatKegiatanPage() {
  const [me, activityTypes, units, fundSources, honorTypes, employees] = await Promise.all([
    meServer(),
    listActivityTypes(),
    listUnits(),
    listFundSources(),
    listHonorTypes(),
    listActiveEmployeesServer(),
  ]);

  // A unit-bound account raises activities for its own unit only; the
  // API rejects any other, so the picker does not offer them.
  const allowedUnits = me.scoped_unit_id ? units.filter((u) => u.id === me.scoped_unit_id) : activeOnly(units);

  return (
    <CreateActivityWizard
      activityTypes={activeOnly(activityTypes)}
      units={allowedUnits}
      fundSources={activeOnly(fundSources)}
      honorTypes={activeOnly(honorTypes)}
      employees={employees}
    />
  );
}
