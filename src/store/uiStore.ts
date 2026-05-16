/**
 * MODULE: Root Store
 * FEATURE: Global Application State
 *
 * PURPOSE:
 * This file acts as the master aggregator for our application's state. 
 * Instead of having one massive 300-line file, we use the "Zustand Slice Pattern" 
 * to divide domains of logic (Chat, Settings, System) into their own files.
 * 
 * WHY USE A SINGLE ROOT STORE (WITH SLICES)?
 * 1. Simplicity: Components only ever need to import `useUIStore`.
 * 2. Cross-slice Reactivity: If `SettingsSlice` needs to read something from `ChatSlice`, 
 *    it can do so easily because they are technically merged into one big object at runtime.
 * 
 * ALTERNATIVE TO ZUSTAND: Redux Toolkit (RTK)
 * Why rejected: RTK requires a lot of boilerplate (actions, reducers, dispatchers). 
 * Zustand gives us Redux-like global state without the boilerplate, treating state 
 * as a simple hook.
 */
import { create } from 'zustand';

// Import our modular slice definitions and creators
import { createSystemSlice, type SystemSlice } from './slices/systemSlice';
import { createChatSlice, type ChatSlice } from './slices/chatSlice';
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice';

/**
 * SYNTAX NOTE: Type Intersection (`&`)
 * We combine our multiple slice interfaces into one master interface.
 * This guarantees that `UIStore` contains all properties from all slices.
 */
export type UIStore = SystemSlice & ChatSlice & SettingsSlice;

/**
 * SYNTAX NOTE: `create<UIStore>()(...)`
 * We initialize the store by calling `create` and passing the combined type.
 * Inside the creator callback, we spread `...` the results of our individual slice creators.
 * 
 * The `(...a)` syntax passes the `set`, `get`, and `api` arguments from Zustand 
 * down to each individual slice creator so they can manipulate the global state.
 */
export const useUIStore = create<UIStore>()((...a) => ({
  ...createSystemSlice(...a),
  ...createChatSlice(...a),
  ...createSettingsSlice(...a),
}));

// We re-export the AiModel type for convenience so components don't have to guess 
// which file it came from.
export type { AiModel } from './slices/settingsSlice';
