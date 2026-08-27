/**
 * WorldWideView Plugin Cross-Compatibility Loader for Silver Wolf VI
 *
 * Dynamically registers and instantiates compiled WorldWideView ES Module plugins
 * inside the Silver Wolf VI runtime via host global injection (__WWV_HOST__).
 */

import { pluginManager } from './PluginManager';
import { injectHostGlobals } from './hostGlobals';
import type { PluginManifest } from './PluginManifest';

/**
 * Pre-defined list of external WorldWideView ecosystem plugins available for cross-loading.
 */
export const AVAILABLE_WWV_CROSS_PLUGINS: PluginManifest[] = [
  {
    id: 'wwv-plugin-aviation',
    name: 'Commercial Aviation Tracker',
    version: '1.4.10',
    type: 'data-layer',
    format: 'bundle',
    trust: 'built-in',
    capabilities: ['data:own', 'globe:overlay'],
    category: 'aviation',
    entry: '../../world-wide-view/worldwideview-plugins/packages/wwv-plugin-aviation/dist/frontend.mjs',
  },
  {
    id: 'wwv-plugin-maritime',
    name: 'Maritime Vessel Tracking (AIS)',
    version: '1.4.10',
    type: 'data-layer',
    format: 'bundle',
    trust: 'built-in',
    capabilities: ['data:own', 'globe:overlay'],
    category: 'maritime',
    entry: '../../world-wide-view/worldwideview-plugins/packages/wwv-plugin-maritime/dist/frontend.mjs',
  },
  {
    id: 'wwv-plugin-undersea-cables',
    name: 'Global Undersea Cable Infrastructure',
    version: '1.4.10',
    type: 'data-layer',
    format: 'bundle',
    trust: 'built-in',
    capabilities: ['data:own', 'globe:overlay'],
    category: 'infrastructure',
    entry: '../../world-wide-view/worldwideview-plugins/packages/wwv-plugin-undersea-cables/dist/frontend.mjs',
  },
  {
    id: 'wwv-plugin-volcanoes',
    name: 'Active Volcano & Volcanic Ash Monitor',
    version: '1.4.10',
    type: 'data-layer',
    format: 'bundle',
    trust: 'built-in',
    capabilities: ['data:own', 'globe:overlay'],
    category: 'natural-disaster',
    entry: '../../world-wide-view/worldwideview-plugins/packages/wwv-plugin-volcanoes/dist/frontend.mjs',
  },
  {
    id: 'wwv-plugin-military-aviation',
    name: 'Military Aviation Sentinel',
    version: '1.4.10',
    type: 'data-layer',
    format: 'bundle',
    trust: 'built-in',
    capabilities: ['data:own', 'globe:overlay'],
    category: 'military',
    entry: '../../world-wide-view/worldwideview-plugins/packages/wwv-plugin-military-aviation/dist/frontend.mjs',
  },
];

/**
 * Initializes host globals and registers cross-compatible WorldWideView plugins into Silver Wolf VI.
 */
export async function initializeWWVCrossCompatibility(): Promise<string[]> {
  await injectHostGlobals();
  await pluginManager.init();

  const loadedIds: string[] = [];
  for (const manifest of AVAILABLE_WWV_CROSS_PLUGINS) {
    try {
      await pluginManager.loadFromManifest(manifest);
      loadedIds.push(manifest.id);
    } catch (err) {
      // Fallback logging for unbuilt or path-restricted bundles
      // eslint-disable-next-line no-console
      console.warn(`[WWVCrossCompat] Manifest loading deferred for ${manifest.id}:`, err);
    }
  }
  return loadedIds;
}
