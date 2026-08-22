import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationData } from '../data/locations';
import type { Tour } from '../data/tours';
import { useLayoutStore } from './layoutStore';

export type InteractionMode = 'chat' | 'orbital' | 'telescope';
export type SyncSource = 'cesium' | 'wwt' | 'none';
export type CosmosBackgroundMode = 'deep-black' | 'sparkling' | 'wwt-milkyway';
export type WwtBackgroundLayer = string;

export interface CelestialOverlaySettings {
  showGrid: boolean;
  showConstellationLines: boolean;
  showConstellationFigures: boolean;
  showConstellationSelection: boolean;
  showConstellationBoundaries: boolean;
}

export interface TelescopePreset {
  name: string;
  url: string;
  ra: string;
  dec: string;
  fov: string;
  description: string;
  lookAt?: string;
}

export interface TelescopeTelemetry {
  ra: number;
  dec: number;
  roll: number;
}

export interface AstronomyState {
  interactionMode: InteractionMode;
  cameraSensitivity: number;
  showBorders: boolean;
  showTerrain: boolean;
  showRoads: boolean;
  activeLocation: LocationData | null;
  measureStart: LocationData | null;
  measureEnd: LocationData | null;
  telescopeTarget: TelescopePreset | null;
  activeTour: Tour | null;
  activeTourStepIndex: number;
  syncSource: SyncSource;
  telescopeTelemetry: TelescopeTelemetry | null;
  browserUrl: string;
  imageryProvider: string;
  spaceBlendOpacity: number;
  cosmosBackgroundMode: CosmosBackgroundMode;
  wwtBackgroundLayer: WwtBackgroundLayer;
  spaceInteractionTarget: 'earth' | 'telescope';
  celestialOverlaySettings: CelestialOverlaySettings;
  celestialCollectionUrl: string | null;

  // Legacy Aliases
  primaryView: InteractionMode;

  setInteractionMode: (mode: InteractionMode) => void;
  setCameraSensitivity: (sensitivity: number) => void;
  setShowBorders: (show: boolean) => void;
  setShowTerrain: (show: boolean) => void;
  setShowRoads: (show: boolean) => void;
  setActiveLocation: (loc: LocationData | null) => void;
  setMeasureStart: (loc: LocationData | null) => void;
  setMeasureEnd: (loc: LocationData | null) => void;
  setTelescopeTarget: (preset: TelescopePreset | null) => void;
  setActiveTour: (tour: Tour | null) => void;
  setActiveTourStepIndex: (index: number) => void;
  setSyncSource: (source: SyncSource) => void;
  setTelescopeTelemetry: (telemetry: TelescopeTelemetry | null) => void;
  setBrowserUrl: (url: string) => void;
  setImageryProvider: (provider: string) => void;
  setSpaceBlendOpacity: (opacity: number) => void;
  setCosmosBackgroundMode: (mode: CosmosBackgroundMode) => void;
  setWwtBackgroundLayer: (layer: WwtBackgroundLayer) => void;
  setSpaceInteractionTarget: (target: 'earth' | 'telescope') => void;
  setCelestialOverlaySettings: (settings: Partial<CelestialOverlaySettings>) => void;
  setCelestialCollectionUrl: (url: string | null) => void;
  setPrimaryView: (mode: InteractionMode) => void;
}

export const useAstronomyStore = create<AstronomyState>()(
  persist(
    (set) => ({
      interactionMode: 'chat',
      cameraSensitivity: 1.0,
      showBorders: false,
      showTerrain: false,
      showRoads: false,
      activeLocation: null,
      measureStart: null,
      measureEnd: null,
      telescopeTarget: null,
      activeTour: null,
      activeTourStepIndex: 0,
      syncSource: 'none',
      telescopeTelemetry: null,
      browserUrl: 'https://nasa.gov',
      imageryProvider: 'arcgis-world',
      spaceBlendOpacity: 0.35,
      cosmosBackgroundMode: 'wwt-milkyway',
      wwtBackgroundLayer: '3D Solar System View',
      spaceInteractionTarget: 'earth',
      celestialOverlaySettings: {
        showGrid: false,
        showConstellationLines: true,
        showConstellationFigures: true,
        showConstellationSelection: true,
        showConstellationBoundaries: false
      },
      celestialCollectionUrl: null,

      primaryView: 'chat',

      setInteractionMode: (interactionMode) => set({ interactionMode, primaryView: interactionMode }),
      setCameraSensitivity: (cameraSensitivity) => set({ cameraSensitivity }),
      setShowBorders: (showBorders) => set({ showBorders }),
      setShowTerrain: (showTerrain) => set({ showTerrain }),
      setShowRoads: (showRoads) => set({ showRoads }),
      setActiveLocation: (activeLocation) => {
        set({ activeLocation });
        if (activeLocation) {
          useLayoutStore.getState().setRightPanelTab('context');
          useLayoutStore.getState().setRightPanelOpen(true);
        }
      },
      setMeasureStart: (measureStart) => set({ measureStart }),
      setMeasureEnd: (measureEnd) => set({ measureEnd }),
      setTelescopeTarget: (telescopeTarget) => set({ telescopeTarget }),
      setActiveTour: (activeTour) => set({ activeTour }),
      setActiveTourStepIndex: (activeTourStepIndex) => set({ activeTourStepIndex }),
      setSyncSource: (syncSource) => set({ syncSource }),
      setTelescopeTelemetry: (telescopeTelemetry) => set({ telescopeTelemetry }),
      setBrowserUrl: (browserUrl) => set({ browserUrl }),
      setImageryProvider: (imageryProvider) => set({ imageryProvider }),
      setSpaceBlendOpacity: (spaceBlendOpacity) => set({ spaceBlendOpacity }),
      setCosmosBackgroundMode: (cosmosBackgroundMode) => set({ cosmosBackgroundMode }),
      setWwtBackgroundLayer: (wwtBackgroundLayer) => set({ wwtBackgroundLayer }),
      setSpaceInteractionTarget: (spaceInteractionTarget) => set({ spaceInteractionTarget }),
      setCelestialOverlaySettings: (settings) =>
        set((s) => ({ celestialOverlaySettings: { ...s.celestialOverlaySettings, ...settings } })),
      setCelestialCollectionUrl: (celestialCollectionUrl) => set({ celestialCollectionUrl }),
      setPrimaryView: (primaryView) => set({ interactionMode: primaryView, primaryView })
    }),
    {
      name: 'silver-wolf-v6-astronomy',
      partialize: (s) => ({
        interactionMode: s.interactionMode,
        cameraSensitivity: s.cameraSensitivity,
        showBorders: s.showBorders,
        showTerrain: s.showTerrain,
        showRoads: s.showRoads,
        browserUrl: s.browserUrl,
        imageryProvider: s.imageryProvider,
        spaceBlendOpacity: s.spaceBlendOpacity,
        cosmosBackgroundMode: s.cosmosBackgroundMode,
        wwtBackgroundLayer: s.wwtBackgroundLayer,
        spaceInteractionTarget: s.spaceInteractionTarget
      })
    }
  )
);
