import 'server-only';

import { serverApiFetch } from '@/lib/api/server';
import type { Employee } from '@/lib/api/employees';

export const listEmployeesServer = () => serverApiFetch<Employee[]>('/api/v1/employees');
