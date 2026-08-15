/**
 * Barrel re-exporting the public LocalDataSource registry API.
 */
export { hasLocalSource, getLocalSourceIds, resolveLocalSnapshot } from './registry';
export type { LocalDataSourceDeclaration, PluginDataSnapshot } from './types';
