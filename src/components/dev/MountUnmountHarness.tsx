import React, { useState, useRef } from 'react';
import WorldWideTelescopeView from '../learning/WorldWideTelescopeView';

export default function MountUnmountHarness() {
  const [mounted, setMounted] = useState(true);
  const cyclesRef = useRef(0);
  const maxCycles = 50;
  const runningRef = useRef(false);

  const startCycles = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    cyclesRef.current = 0;
    const t = setInterval(() => {
      setMounted((m) => !m);
      cyclesRef.current++;
      console.log(`[MountHarness] cycle ${cyclesRef.current} toggled.`);
      try {
        // performance.memory is non-standard, show if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mem = (performance as any)?.memory;
        if (mem) console.log('[MountHarness] memory', mem);
      } catch (e) {
        // ignore
      }
      if (cyclesRef.current >= maxCycles) {
        clearInterval(t);
        runningRef.current = false;
        console.log('[MountHarness] finished cycles');
      }
    }, 1000);
  };

  // Auto-run cycles when `?mountharness&autorun=1` is present (useful for CI/dev stress testing)
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search.includes('autorun')) {
        startCycles();
      }
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 text-white">
      <div className="mb-2 flex gap-2">
        <button onClick={() => setMounted(true)} className="bg-primary/20 px-3 py-1 rounded">Mount</button>
        <button onClick={() => setMounted(false)} className="bg-amber-700/10 px-3 py-1 rounded">Unmount</button>
        <button onClick={startCycles} className="bg-cyan-700/10 px-3 py-1 rounded">Run cycles (50)</button>
      </div>
      <div className="border rounded p-2 h-96 overflow-hidden bg-black/10">
        {mounted ? <WorldWideTelescopeView /> : <div className="text-white/40">Unmounted</div>}
      </div>
    </div>
  );
}
