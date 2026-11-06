import { create } from 'zustand';
import wwtCatalog from '@/data/astronomy/wwtConstellations.json';

export type ObservatoryMode = 'sky' | 'solar' | 'map' | 'asteroid';
export type SkyTarget = { id: string; name: string; ra_deg: number; dec_deg: number };
export type ConstellationEntry = SkyTarget & { regions: SkyTarget[] };
export type Layers = { figures: boolean; boundaries: boolean; labels: boolean; grid: boolean; artwork: boolean };

interface ObservatoryState {
  navigation: 'look' | 'orbit';
  mode: ObservatoryMode;
  target: SkyTarget;
  body: string;
  layers: Layers;
  survey: string;
  utc: string;
  playing: boolean;
  speed: number;
  latitude: number;
  longitude: number;
  altitude_km: number;
  set: (patch: Partial<Omit<ObservatoryState, 'set'>>) => void;
}

export function initialObservatoryView(search: string) {
  const query = new URLSearchParams(search);
  const target = wwtCatalog.constellations.flatMap((entry) => entry.regions)
    .find((entry) => entry.id === query.get('target')) ?? { id: 'ORI', name: 'Orion', ra_deg: 83.6475, dec_deg: 5.949 };
  const date = new Date(query.get('utc') || '');
  const utc = Number.isFinite(date.getTime()) && date.getUTCFullYear() >= 2000 && date.getUTCFullYear() <= 2050
    ? date.toISOString() : new Date().toISOString();
  return { target, utc };
}

const initialView = initialObservatoryView(typeof window === 'undefined' ? '' : window.location.search);

export const useObservatory = create<ObservatoryState>((set) => ({
  navigation: 'look',
  mode: 'sky', target: initialView.target,
  body: 'earth', layers: { figures: true, boundaries: false, labels: true, grid: false, artwork: false },
  survey: 'Digitized Sky Survey (Color)', utc: initialView.utc, playing: false, speed: 3600,
  latitude: 1.3521, longitude: 103.8198, altitude_km: 0,
  set: (patch) => set(patch),
}));
