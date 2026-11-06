import { useEffect, useState } from 'react';
import { useObservatory, type ConstellationEntry } from '@/core/state/observatoryStore';

export type Vector3 = [number, number, number];
export interface AstronomyScene {
  utc: string;
  model: string;
  observer: { earth_fixed_km: Vector3; earth_relative_inertial_km: Vector3; barycentric_icrs_km: Vector3; heliocentric_ecliptic_km: Vector3; altitude_km: number };
  target: { altitude_deg: number; azimuth_deg: number; ra_deg: number; dec_deg: number; direction_ecliptic: Vector3; above_geometric_horizon: boolean };
  bodies: { id: string; name: string; radius_km: number; heliocentric_ecliptic_km: Vector3; distance_from_camera_km: number }[];
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const result = await fetch(url, { signal });
  if (!result.ok) {
    const body = await result.json().catch(() => null);
    throw new Error(typeof body?.detail === 'string' ? body.detail : 'Astronomy service is unavailable. Start the Python service and retry.');
  }
  return result.json();
}

export function useConstellationCatalog() {
  const [catalog, setCatalog] = useState<ConstellationEntry[]>([]);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getJson<{ constellations: ConstellationEntry[] }>('api/astronomy/constellations', controller.signal)
      .then((data) => setCatalog(data.constellations))
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [retry]);
  return { catalog, error, retry: () => setRetry((n) => n + 1) };
}

export function useAstronomy() {
  const { utc, latitude, longitude, altitude_km, target } = useObservatory();
  const [scene, setScene] = useState<AstronomyScene | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams({ utc, latitude: String(latitude), longitude: String(longitude), altitude_km: String(altitude_km), ra_deg: String(target.ra_deg), dec_deg: String(target.dec_deg) });
      getJson<AstronomyScene>(`api/astronomy/scene?${query}`, controller.signal)
        .then((data) => { setScene(data); setError(''); setPending(false); })
        .catch((e) => { if (!controller.signal.aborted) { setError(e.message); setPending(false); } });
    }, 150);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [utc, latitude, longitude, altitude_km, target.ra_deg, target.dec_deg]);
  return { scene, error, pending: pending || !scene };
}
