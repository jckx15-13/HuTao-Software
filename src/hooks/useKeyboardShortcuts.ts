import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

export function useKeyboardShortcuts() {
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);
  const setCurrentPage = useUIStore((s) => s.setCurrentPage);
  const setLeftPanelOpen = useUIStore((s) => s.setLeftPanelOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Alt is pressed
      if (!e.altKey) return;

      switch (e.key) {
        case '1':
          setInteractionMode('chat');
          break;
        case '2':
          setInteractionMode('orbital');
          break;
        case '3':
          setInteractionMode('telescope');
          break;
        case 's':
        case 'S':
          setCurrentPage('settings');
          break;
        case 'w':
        case 'W':
          setCurrentPage('workspace');
          break;
        case 'l':
        case 'L':
          setLeftPanelOpen(!leftPanelOpen);
          break;
        case 'r':
        case 'R':
          setRightPanelOpen(!rightPanelOpen);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leftPanelOpen, rightPanelOpen, setInteractionMode, setCurrentPage, setLeftPanelOpen, setRightPanelOpen]);
}
