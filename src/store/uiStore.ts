import type { StoreApi } from 'zustand';
import { useLayoutStore, type LayoutState } from './layoutStore';
import { useThemeStore, type ThemeState } from './themeStore';
import { useChatStore, type ChatState } from './chatStore';
import { useTelemetryStore, type TelemetryState } from './telemetryStore';
import { useAstronomyStore, type AstronomyState } from './astronomyStore';

// Re-export slice stores
export { useLayoutStore } from './layoutStore';
export { useThemeStore } from './themeStore';
export { useChatStore } from './chatStore';
export { useTelemetryStore } from './telemetryStore';
export { useAstronomyStore } from './astronomyStore';

// Re-export domain types
export type { LayoutState, CurrentPage, RightPanelTab, SettingsCategory } from './layoutStore';
export type { ThemeState, Personalisation } from './themeStore';
export type { ChatState, AiModel, ChatSession } from './chatStore';
export type { TelemetryState, SystemMetrics, DiagnosticEntry, ChangeLogEntry, SatelliteData } from './telemetryStore';
export type {
  AstronomyState,
  InteractionMode,
  SyncSource,
  CosmosBackgroundMode,
  WwtBackgroundLayer,
  CelestialOverlaySettings,
  TelescopePreset,
  TelescopeTelemetry
} from './astronomyStore';

export type UIStore = LayoutState &
  ThemeState &
  ChatState &
  TelemetryState &
  AstronomyState & {
    updateSettings: (settings: Partial<UIStore>) => void;
  };

function patchDomain<S extends object>(store: Pick<StoreApi<S>, 'setState' | 'getInitialState'>, settings: Partial<UIStore>): void {
  const initial = store.getInitialState();
  const patch = Object.fromEntries(Object.entries(settings).filter(([key]) => Object.hasOwn(initial, key))) as Partial<S>;
  if (Object.keys(patch).length) store.setState(patch);
}

function updateSettings(settings: Partial<UIStore>): void {
  patchDomain(useLayoutStore, settings);
  patchDomain(useThemeStore, settings);
  patchDomain(useChatStore, settings);
  patchDomain(useTelemetryStore, settings);
  patchDomain(useAstronomyStore, settings);
}

// Unified snapshot getter
function getUnifiedState(): UIStore {
  const layout = useLayoutStore.getState();
  const theme = useThemeStore.getState();
  const chat = useChatStore.getState();
  const telemetry = useTelemetryStore.getState();
  const astronomy = useAstronomyStore.getState();

  return {
    ...layout,
    ...theme,
    ...chat,
    ...telemetry,
    ...astronomy,
    updateSettings
  };
}

// Facade Hook
export function useUIStore(): UIStore;
export function useUIStore<U>(selector: (state: UIStore) => U): U;
export function useUIStore<U>(selector?: (state: UIStore) => U): U | UIStore {
  const layout = useLayoutStore();
  const theme = useThemeStore();
  const chat = useChatStore();
  const telemetry = useTelemetryStore();
  const astronomy = useAstronomyStore();

  const combined: UIStore = {
    ...layout,
    ...theme,
    ...chat,
    ...telemetry,
    ...astronomy,
    updateSettings
  };

  return selector ? selector(combined) : combined;
}

useUIStore.getState = getUnifiedState;
useUIStore.setState = (partial: Partial<UIStore> | ((state: UIStore) => Partial<UIStore>)) => {
  const next = typeof partial === 'function' ? partial(getUnifiedState()) : partial;
  updateSettings(next);
};

useUIStore.subscribe = (listener: (state: UIStore, prevState: UIStore) => void) => {
  let prev = getUnifiedState();
  const handler = () => {
    const curr = getUnifiedState();
    listener(curr, prev);
    prev = curr;
  };
  const unsub1 = useLayoutStore.subscribe(handler);
  const unsub2 = useThemeStore.subscribe(handler);
  const unsub3 = useChatStore.subscribe(handler);
  const unsub4 = useTelemetryStore.subscribe(handler);
  const unsub5 = useAstronomyStore.subscribe(handler);
  return () => {
    unsub1();
    unsub2();
    unsub3();
    unsub4();
    unsub5();
  };
};

if (typeof window !== 'undefined') {
  (window as Window & { useUIStore?: typeof useUIStore }).useUIStore = useUIStore;
}
