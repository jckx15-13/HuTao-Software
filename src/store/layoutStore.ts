import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveStartupLayout } from '../core/defaults/uiDefaults';

export type CurrentPage = 'launcher' | 'workspace' | 'settings';
export type RightPanelTab = 'context' | 'browser' | 'changes' | 'diagnostics' | 'telemetry' | 'odysseus';
export type SettingsCategory =
  | 'personalisation'
  | 'ai'
  | 'connections'
  | 'feedback'
  | 'developer'
  | 'about'
  | 'map'
  | 'plugins';

export interface LayoutState {
  // Panel States
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelTab: RightPanelTab;
  topBarOpen: boolean;
  modeSwitcherOpen: boolean;
  bottomBarOpen: boolean;
  spaceHudTab: 'navigation' | 'layers' | 'target' | 'system';

  // Navigation & Dialogs
  currentPage: CurrentPage;
  launcherDismissed: boolean;
  settingsCategory: SettingsCategory;

  // Legacy Aliases
  sidebarOpen: boolean;
  showSettings: boolean;
  rightPanelMode: 'monitor' | 'learning';
  settingsDocked: boolean;

  // Actions
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setTopBarOpen: (open: boolean) => void;
  setModeSwitcherOpen: (open: boolean) => void;
  setBottomBarOpen: (open: boolean) => void;
  setSpaceHudTab: (tab: 'navigation' | 'layers' | 'target' | 'system') => void;
  setCurrentPage: (page: CurrentPage) => void;
  setLauncherDismissed: (dismissed: boolean) => void;
  setSettingsCategory: (category: SettingsCategory) => void;
  setSidebarOpen: (open: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setRightPanelMode: (mode: 'monitor' | 'learning') => void;
  setSettingsDocked: (docked: boolean) => void;
}

const initialLayout =
  typeof window !== 'undefined' ? resolveStartupLayout() : { leftPanelOpen: true, rightPanelOpen: true };

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      leftPanelOpen: initialLayout.leftPanelOpen,
      rightPanelOpen: initialLayout.rightPanelOpen,
      rightPanelTab: 'context',
      topBarOpen: true,
      modeSwitcherOpen: true,
      bottomBarOpen: true,
      spaceHudTab: 'layers',
      currentPage: 'launcher',
      launcherDismissed: false,
      settingsCategory: 'personalisation',
      rightPanelMode: 'monitor',
      settingsDocked: false,
      sidebarOpen: initialLayout.leftPanelOpen,
      showSettings: false,

      setLeftPanelOpen: (leftPanelOpen) => {
        if (leftPanelOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
          set({ leftPanelOpen: true, rightPanelOpen: false, sidebarOpen: true });
        } else {
          set({ leftPanelOpen, sidebarOpen: leftPanelOpen });
        }
      },
      setRightPanelOpen: (rightPanelOpen) => {
        if (rightPanelOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
          set({ rightPanelOpen: true, leftPanelOpen: false, sidebarOpen: false });
        } else {
          set({ rightPanelOpen });
        }
      },
      setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
      setTopBarOpen: (topBarOpen) => set({ topBarOpen }),
      setModeSwitcherOpen: (modeSwitcherOpen) => set({ modeSwitcherOpen }),
      setBottomBarOpen: (bottomBarOpen) => set({ bottomBarOpen }),
      setSpaceHudTab: (spaceHudTab) => set({ spaceHudTab }),
      setCurrentPage: (currentPage) => set({ currentPage, showSettings: currentPage === 'settings' }),
      setLauncherDismissed: (launcherDismissed) => set({ launcherDismissed, currentPage: 'workspace', showSettings: false }),
      setSettingsCategory: (settingsCategory) => set({ settingsCategory }),
      setSidebarOpen: (sidebarOpen) => {
        if (sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
          set({ leftPanelOpen: true, rightPanelOpen: false, sidebarOpen: true });
        } else {
          set({ leftPanelOpen: sidebarOpen, sidebarOpen });
        }
      },
      setShowSettings: (show) => set({ currentPage: show ? 'settings' : 'workspace', showSettings: show }),
      setRightPanelMode: (rightPanelMode) => set({ rightPanelMode }),
      setSettingsDocked: (settingsDocked) => set({ settingsDocked })
    }),
    {
      name: 'silver-wolf-v6-layout',
      partialize: (s) => ({
        leftPanelOpen: s.leftPanelOpen,
        rightPanelOpen: s.rightPanelOpen,
        launcherDismissed: s.launcherDismissed,
        settingsCategory: s.settingsCategory
      })
    }
  )
);
