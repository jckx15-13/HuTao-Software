/**
 * MODULE: System Slice (Zustand Store)
 * 
 * PURPOSE:
 * This slice manages ephemeral system-level metrics and hardware simulations 
 * (like CPU load, RAM, battery) to feed the cyberpunk aesthetic of the UI.
 * 
 * WHY A "SLICE" PATTERN?
 * Zustand stores can grow massive and hard to read. By breaking the store into "slices",
 * we maintain a single global state object (which is better for cross-slice reactivity)
 * while keeping our code files small, modular, and domain-specific.
 * 
 * ALTERNATIVES CONSIDERED:
 * 1. Multiple separate stores (`useSystemStore`, `useChatStore`).
 *    Why rejected: If chat messages need to affect CPU load (e.g., spike CPU when typing),
 *    synchronizing two separate stores is messy. A single store with slices is cleaner.
 * 2. React Context API.
 *    Why rejected: Context triggers re-renders on ALL consumers whenever ANY value changes.
 *    Zustand uses selectors to avoid unnecessary re-renders.
 */

import { StateCreator } from 'zustand';

// SYNTAX NOTE: Interface Definition
// We define the exact shape of our system metrics.
export interface SystemMetrics {
  ramUsage: number;
  networkLatency: number;
  storageUsage: number;
  batteryLevel: number;
}

// SYNTAX NOTE: The state and the actions (setters) are defined together.
export interface SystemSlice {
  cpuLoad: number; // 0.0 to 1.0
  setCpuLoad: (val: number) => void;
  
  systemMetrics: SystemMetrics;
  updateSystemMetrics: (data: Partial<SystemMetrics>) => void;
}

/**
 * `StateCreator` is a Zustand type that provides type safety for our slice.
 * We pass the entire store type (we'll define this in the main store file later, 
 * but for isolated slices, we can just use `any` or generic bounds if we want to be strict).
 * Here, we use `SystemSlice` as the expected return type.
 */
export const createSystemSlice: StateCreator<SystemSlice, [], [], SystemSlice> = (set) => ({
  cpuLoad: 0.2,
  
  // SYNTAX NOTE: Math.max/min for clamping.
  // We ensure the CPU load never exceeds 1 (100%) or drops below 0 (0%).
  setCpuLoad: (val) => set({ cpuLoad: Math.max(0, Math.min(1, val)) }),
  
  systemMetrics: {
    ramUsage: 0.2,
    networkLatency: 0.8,
    storageUsage: 0.15,
    batteryLevel: 0.9,
  },
  
  // SYNTAX NOTE: State Updater Function
  // We pass a callback to `set` to access the current state `(state) => ({...})`
  // This is required when the new state depends on the old state (merging partial data).
  updateSystemMetrics: (data) => set((state) => ({ 
    systemMetrics: { ...state.systemMetrics, ...data } 
  })),
});
