import { apiFetch } from '@/lib/api/client';

/**
 * Only active master data may be attached to a new activity — the API
 * validates this (StoreActivityRequest), so offering inactive options in
 * a picker would only produce a 422 after the user has filled the form.
 */
export function activeOnly<T extends { status: string }>(rows: T[]): T[] {
  return rows.filter((row) => row.status === 'active');
}

/**
 * Same as activeOnly, but keeps whatever the record already points at.
 * An activity created before a unit was retired still references it; if
 * the edit form dropped that option, the select would silently fall back
 * to the first entry and change the value on save.
 */
export function activeOrCurrent<T extends { id: number; status: string }>(rows: T[], currentId: number): T[] {
  return rows.filter((row) => row.status === 'active' || row.id === currentId);
}

export type Unit = { id: number; code: string; name: string; status: string };
export type Position = { id: number; code: string; name: string; status: string };
export type ActivityType = { id: number; code: string; name: string; description: string | null; status: string };
export type HonorType = { id: number; code: string; name: string; unit: string; description: string | null; status: string };
export type FundSource = { id: number; code: string; name: string; description: string | null; status: string };
export type HonorRate = {
  id: number;
  honor_type: HonorType;
  unit: Unit | null;
  rate: number;
  effective_from: string;
  effective_to: string | null;
  status: string;
};

export type SimpleMasterDataInput = {
  code: string;
  name: string;
  description?: string;
  unit?: string;
  status?: 'active' | 'inactive';
};

export const createUnit = (input: SimpleMasterDataInput): Promise<Unit> =>
  apiFetch('/api/v1/units', { method: 'POST', body: input });

export const createPosition = (input: SimpleMasterDataInput): Promise<Position> =>
  apiFetch('/api/v1/positions', { method: 'POST', body: input });

export const createActivityType = (input: SimpleMasterDataInput): Promise<ActivityType> =>
  apiFetch('/api/v1/activity-types', { method: 'POST', body: input });

export const createHonorType = (input: SimpleMasterDataInput): Promise<HonorType> =>
  apiFetch('/api/v1/honor-types', { method: 'POST', body: input });

export const createFundSource = (input: SimpleMasterDataInput): Promise<FundSource> =>
  apiFetch('/api/v1/fund-sources', { method: 'POST', body: input });

export const updateUnit = (id: number, input: Partial<SimpleMasterDataInput>): Promise<Unit> =>
  apiFetch(`/api/v1/units/${id}`, { method: 'PUT', body: input });

export const updatePosition = (id: number, input: Partial<SimpleMasterDataInput>): Promise<Position> =>
  apiFetch(`/api/v1/positions/${id}`, { method: 'PUT', body: input });

export const updateActivityType = (id: number, input: Partial<SimpleMasterDataInput>): Promise<ActivityType> =>
  apiFetch(`/api/v1/activity-types/${id}`, { method: 'PUT', body: input });

export const updateHonorType = (id: number, input: Partial<SimpleMasterDataInput>): Promise<HonorType> =>
  apiFetch(`/api/v1/honor-types/${id}`, { method: 'PUT', body: input });

export const updateFundSource = (id: number, input: Partial<SimpleMasterDataInput>): Promise<FundSource> =>
  apiFetch(`/api/v1/fund-sources/${id}`, { method: 'PUT', body: input });

export type CreateHonorRateInput = {
  honor_type_id: number;
  unit_id?: number;
  rate: number;
  effective_from: string;
  effective_to?: string;
};

export const createHonorRate = (input: CreateHonorRateInput): Promise<HonorRate> =>
  apiFetch('/api/v1/honor-rates', { method: 'POST', body: input });

export const updateHonorRate = (
  id: number,
  input: Partial<CreateHonorRateInput> & { status?: 'active' | 'inactive' }
): Promise<HonorRate> => apiFetch(`/api/v1/honor-rates/${id}`, { method: 'PUT', body: input });
