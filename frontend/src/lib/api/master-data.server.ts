import 'server-only';

import { serverApiFetch } from '@/lib/api/server';
import type {
  ActivityType,
  FundSource,
  HonorRate,
  HonorType,
  Position,
  Unit,
} from '@/lib/api/master-data';

export const listUnits = () => serverApiFetch<Unit[]>('/api/v1/units');
export const listPositions = () => serverApiFetch<Position[]>('/api/v1/positions');
export const listActivityTypes = () => serverApiFetch<ActivityType[]>('/api/v1/activity-types');
export const listFundSources = () => serverApiFetch<FundSource[]>('/api/v1/fund-sources');
export const listHonorTypes = () => serverApiFetch<HonorType[]>('/api/v1/honor-types');
export const listHonorRates = () => serverApiFetch<HonorRate[]>('/api/v1/honor-rates');
