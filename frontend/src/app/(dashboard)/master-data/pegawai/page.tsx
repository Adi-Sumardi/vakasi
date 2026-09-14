import { listEmployeesServer } from '@/lib/api/employees.server';
import { listUnits, listPositions } from '@/lib/api/master-data.server';
import { EmployeeManager } from '@/components/master-data/employee-manager';

export default async function PegawaiPage() {
  const [employees, units, positions] = await Promise.all([
    listEmployeesServer(),
    listUnits(),
    listPositions(),
  ]);

  return <EmployeeManager employees={employees} units={units} positions={positions} />;
}
