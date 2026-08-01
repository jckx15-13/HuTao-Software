declare const __SILVER_WOLF_BRIDGE_URL__: string | undefined;
declare const __SILVER_WOLF_ODYSSEUS_CORE_URL__: string | undefined;

import { getCredentialEndpoint } from './credentials/apiCredentialEngine';

export const FALLBACK_BRIDGE_URL = 'http://127.0.0.1:8001';
export const FALLBACK_ODYSSEUS_CORE_URL = 'http://127.0.0.1:7000';

function configuredBuildValue(name: 'bridge' | 'odysseus-core'): string {
  if (name === 'bridge' && typeof __SILVER_WOLF_BRIDGE_URL__ !== 'undefined') {
    return __SILVER_WOLF_BRIDGE_URL__;
  }
  if (name === 'odysseus-core' && typeof __SILVER_WOLF_ODYSSEUS_CORE_URL__ !== 'undefined') {
    return __SILVER_WOLF_ODYSSEUS_CORE_URL__;
  }
  return '';
}

function storedEndpointOverride(): string {
  if (typeof window === 'undefined') return '';
  const store = (window as any).useUIStore;
  const stateOverride = store?.getState?.()?.engineUrlOverride || '';
  const credentialOverride = getCredentialEndpoint('bridge');
  return stateOverride || credentialOverride;
}

export function normalizeBridgeBaseUrl(rawUrl?: string | null, fallback = FALLBACK_BRIDGE_URL): string {
  const trimmed = (rawUrl || '').trim();
  const value = trimmed || fallback;
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `http://${value}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol === 'ws:') parsed.protocol = 'http:';
    if (parsed.protocol === 'wss:') parsed.protocol = 'https:';
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fallback;
    }

    parsed.hash = '';
    parsed.search = '';
    parsed.pathname = parsed.pathname.replace(/\/stream\/?$/i, '') || '/';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return fallback;
  }
}

export function getBridgeBaseUrl(): string {
  return normalizeBridgeBaseUrl(storedEndpointOverride() || configuredBuildValue('bridge') || FALLBACK_BRIDGE_URL);
}

export function getOdysseusCoreBaseUrl(): string {
  return normalizeBridgeBaseUrl(
    configuredBuildValue('odysseus-core') || FALLBACK_ODYSSEUS_CORE_URL,
    FALLBACK_ODYSSEUS_CORE_URL
  );
}

export function bridgeUrl(path = ''): string {
  const suffix = path ? `/${path.replace(/^\/+/, '')}` : '';
  return `${getBridgeBaseUrl()}${suffix}`;
}

/**
 * Sentinel values for VITE_BRIDGE_URL meaning "there is no bridge, do not try".
 * Static hosts (GitHub Pages) have no 127.0.0.1:8001 to talk to, so the build
 * sets VITE_BRIDGE_URL=off and the app runs in static/demo mode.
 */
const BRIDGE_DISABLED_VALUES = new Set(['off', 'none', 'disabled', 'static', 'demo', 'false', '0']);

/**
 * False when this build was produced without a reachable bridge. A runtime
 * override (Developer Settings / credential engine) always re-enables it, so a
 * static deployment can still be pointed at a real bridge by hand.
 */
export function isBridgeEnabled(): boolean {
  if (storedEndpointOverride().trim()) return true;
  return !BRIDGE_DISABLED_VALUES.has(configuredBuildValue('bridge').trim().toLowerCase());
}

/** Thrown instead of issuing a request when the bridge is disabled for this build. */
export class BridgeOfflineError extends Error {
  readonly bridgeOffline = true;
  constructor(message = 'Bridge is disabled for this build (static/demo mode).') {
    super(message);
    this.name = 'BridgeOfflineError';
  }
}

export function isBridgeOfflineError(error: unknown): boolean {
  return Boolean((error as BridgeOfflineError | null)?.bridgeOffline);
}

const DEFAULT_BRIDGE_TIMEOUT_MS = 5000;

/**
 * Bridge-aware fetch. Rejects immediately with BridgeOfflineError when no bridge
 * exists, and otherwise bounds the request so a dead endpoint cannot hang the UI.
 * Callers already handle rejection via their existing offline fallbacks.
 */
export async function bridgeFetch(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  if (!isBridgeEnabled()) {
    throw new BridgeOfflineError();
  }

  const { timeoutMs = DEFAULT_BRIDGE_TIMEOUT_MS, signal, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    return await fetch(bridgeUrl(path), { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
