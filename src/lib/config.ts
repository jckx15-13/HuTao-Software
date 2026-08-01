import { getCredentialSecret } from './credentials/apiCredentialEngine';

export interface AppConfig {
  GOOGLE_MAPS_API_KEY: string;
  CESIUM_ION_ACCESS_TOKEN: string;
}

let cachedConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    // BASE_URL (trailing slash included) keeps this correct when the app is
    // served from a sub-path such as GitHub Pages' /HuTao-Software/.
    const res = await fetch(`${import.meta.env.BASE_URL}config.json`);
    if (!res.ok) throw new Error('Failed to load config.json');
    const data = await res.json();
    cachedConfig = {
      GOOGLE_MAPS_API_KEY:
        getCredentialSecret('google-cloud') ||
        data.GOOGLE_MAPS_API_KEY ||
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
        '',
      CESIUM_ION_ACCESS_TOKEN: data.CESIUM_ION_ACCESS_TOKEN || import.meta.env.VITE_CESIUM_ION_TOKEN || ''
    };
    return cachedConfig;
  } catch (err) {
    console.warn('Could not load /config.json, falling back to env vars');
    cachedConfig = {
      GOOGLE_MAPS_API_KEY: getCredentialSecret('google-cloud') || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      CESIUM_ION_ACCESS_TOKEN: import.meta.env.VITE_CESIUM_ION_TOKEN || ''
    };
    return cachedConfig;
  }
}
