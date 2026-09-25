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

/** Master lists are small; load them whole so pickers and tables are complete. */
export const listUnits = () => serverApiFetch<Unit[]>('/api/v1/units?per_page=1000');
export const listPositions = () => serverApiFetch<Position[]>('/api/v1/positions?per_page=1000');
export const listActivityTypes = () => serverApiFetch<ActivityType[]>('/api/v1/activity-types?per_page=1000');
export const listFundSources = () => serverApiFetch<FundSource[]>('/api/v1/fund-sources?per_page=1000');
export const listHonorTypes = () => serverApiFetch<HonorType[]>('/api/v1/honor-types?per_page=1000');
export const listHonorRates = () => serverApiFetch<HonorRate[]>('/api/v1/honor-rates?per_page=1000');
