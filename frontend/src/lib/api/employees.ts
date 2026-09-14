import { apiFetch } from '@/lib/api/client';
import type { Position, Unit } from '@/lib/api/master-data';

export type Employee = {
  id: number;
  employee_code: string;
  nip: string | null;
  nuptk: string | null;
  name: string;
  employee_type: string;
  status: string;
  unit: Unit | null;
  position: Position | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
};

export type CreateEmployeeInput = {
  unit_id: number;
  position_id: number;
  employee_code: string;
  nip?: string;
  name: string;
  employee_type: 'guru' | 'tu' | 'tendik' | 'panitia';
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
};

export function listEmployees(): Promise<Employee[]> {
  return apiFetch<Employee[]>('/api/v1/employees');
}

export function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  return apiFetch<Employee>('/api/v1/employees', { method: 'POST', body: input });
}

export function updateEmployee(id: number, input: Partial<CreateEmployeeInput>): Promise<Employee> {
  return apiFetch<Employee>(`/api/v1/employees/${id}`, { method: 'PUT', body: input });
}

export function updateEmployeeStatus(id: number, status: 'active' | 'inactive'): Promise<Employee> {
  return apiFetch<Employee>(`/api/v1/employees/${id}/status`, { method: 'PATCH', body: { status } });
}
