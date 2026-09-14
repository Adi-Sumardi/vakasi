import { apiFetch } from '@/lib/api/client';

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
