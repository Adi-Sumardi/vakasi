import 'server-only';

import { serverApiFetch } from '@/lib/api/server';
import type { Employee } from '@/lib/api/employees';

/**
 * Every active employee, for pickers such as the panitia list. Loaded
 * whole (the API caps a page at 1000): a paged picker would silently
 * hide everyone after the first page.
 */
export const listActiveEmployeesServer = () =>
  serverApiFetch<Employee[]>('/api/v1/employees?status=active&per_page=1000');
