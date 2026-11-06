import { create } from 'zustand';

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

export const useObservatory = create<ObservatoryState>((set) => ({
  navigation: 'look',
  mode: 'sky', target: { id: 'ORI', name: 'Orion', ra_deg: 83.6475, dec_deg: 5.949 },
  body: 'earth', layers: { figures: true, boundaries: false, labels: true, grid: false, artwork: false },
  survey: 'Digitized Sky Survey (Color)', utc: new Date().toISOString(), playing: false, speed: 3600,
  latitude: 1.3521, longitude: 103.8198, altitude_km: 0,
  set: (patch) => set(patch),
}));
