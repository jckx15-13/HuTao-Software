import { useUIStore } from '../store/uiStore';
import { useCallback, useRef, useEffect } from 'react';

export function useAudioFeedback() {
  const audioFeedback = useUIStore(s => s.audioFeedback);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (audioFeedback && !audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else if (!audioFeedback && audioCtx.current) {
      audioCtx.current.close().catch(() => {});
      audioCtx.current = null;
    }
  }, [audioFeedback]);

  const playClick = useCallback(() => {
    if (!audioFeedback || !audioCtx.current) return;
    try {
      if (audioCtx.current.state === 'suspended') {
        audioCtx.current.resume();
      }
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.current.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.05, audioCtx.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      
      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.05);
    } catch(e) {}
  }, [audioFeedback]);

  const playBlip = useCallback(() => {
    if (!audioFeedback || !audioCtx.current) return;
    try {
      if (audioCtx.current.state === 'suspended') {
        audioCtx.current.resume();
      }
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, audioCtx.current.currentTime);
      osc.frequency.setValueAtTime(600, audioCtx.current.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.02, audioCtx.current.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.current.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      
      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.1);
    } catch(e) {}
  }, [audioFeedback]);

  return { playClick, playBlip };
}
