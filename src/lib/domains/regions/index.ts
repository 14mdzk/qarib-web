export { type RegionResponse } from './schema.js';
export {
	fetchRegionsPage,
	accumulateRegions,
	fetchProvinces,
	fetchCities,
	fetchRegionById,
	type ListRegionsArgs,
	type GetRegionArgs
} from './service.js';
export { regionKeys, defineRegionsListQuery, defineRegionByIdQuery } from './queries.js';
