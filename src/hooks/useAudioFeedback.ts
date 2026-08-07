// ============================================================================
// 🔊 Synthesized Audio Feedback Hook (useAudioFeedback.ts)
// ============================================================================
// Low-level mechanics:
// 1. Instantiates a browser-level Web Audio Context lazily on toggle.
// 2. Uses `useRef` to persist context references across render cycles without re-renders.
// 3. Spawns dynamic Oscillator and Gain nodes to synthesize waves programmatically.
// 4. Applies exponential/linear scheduling parameter changes to build sound shapes.
// ============================================================================

import { useUIStore } from '../store/uiStore'; // State store: determines if audio feedback is toggled active.
import { useCallback, useRef, useEffect } from 'react'; // React hooks for memoization and reference persistence.

export function useAudioFeedback() {
  const audioFeedback = useUIStore(s => s.audioFeedback); // Pull dynamic toggle state from store.
  const audioCtx = useRef<AudioContext | null>(null); // useRef holds the active AudioContext instance without triggering renders when changed.

  // Effect: Initializes or cleans up the audio context driver depending on store state.
  useEffect(() => {
    if (audioFeedback && !audioCtx.current) {
      // Lazy instantiation: Create the AudioContext instance only when feedback is turned on.
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else if (!audioFeedback && audioCtx.current) {
      // Cleanup: Close the audio channel to free up system sound drivers.
      audioCtx.current.close().catch(() => {});
      audioCtx.current = null;
    }
  }, [audioFeedback]); // Re-runs whenever the user checks/unchecks the "Sound feedback" toggle.

  // Action: Generates a short, sharp typewriter-like click sound.
  const playClick = useCallback(() => {
    if (!audioFeedback || !audioCtx.current) return;
    try {
      // Web browser security: Resume suspended context if browser throttled it due to lack of user interaction.
      if (audioCtx.current.state === 'suspended') {
        audioCtx.current.resume();
      }
      
      // Node construction: Create a sound wave generator (Oscillator) and a volume controller (Gain).
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      
      osc.type = 'sine'; // Use a smooth sine wave shape.
      
      // Pitch scheduling: Start sound at 800Hz, then slide it down to 300Hz over 0.05s to simulate an impact click.
      osc.frequency.setValueAtTime(800, audioCtx.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.current.currentTime + 0.05);
      
      // Volume envelope: Start volume at 5% (0.05) and drop it exponentially to almost zero (0.001) over 0.05s to avoid crackle.
      gain.gain.setValueAtTime(0.05, audioCtx.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.05);
      
      // Connections: Generator -> Volume Controller -> Speakers (destination).
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      
      // Playback boundaries: Trigger start and schedule automatic stop at 0.05s.
      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.05);
    } catch(e) { /* ignore audio playback errors */ }
  }, [audioFeedback]);

  // Action: Generates a dual-pitch notification chime sound.
  const playBlip = useCallback(() => {
    if (!audioFeedback || !audioCtx.current) return;
    try {
      if (audioCtx.current.state === 'suspended') {
        audioCtx.current.resume();
      }
      
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      
      osc.type = 'square'; // Use a buzzy square wave shape to sound like a retro computer blip.
      
      // Pitch scheduling: Start pitch at 400Hz, then jump immediately to 600Hz at 0.05s.
      osc.frequency.setValueAtTime(400, audioCtx.current.currentTime);
      osc.frequency.setValueAtTime(600, audioCtx.current.currentTime + 0.05);
      
      // Volume envelope: Start volume at 2% (0.02) and ramp down linearly to 0 over 0.1s.
      gain.gain.setValueAtTime(0.02, audioCtx.current.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.current.currentTime + 0.1);
      
      // Connections: Generator -> Volume Controller -> Speakers.
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      
      // Playback boundaries: Trigger start and stop at 0.1s.
      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.1);
    } catch(e) { /* ignore audio playback errors */ }
  }, [audioFeedback]);

  return { playClick, playBlip };
}
