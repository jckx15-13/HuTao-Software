import { useEffect, useRef } from 'react';

type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: IdleCallback, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export function useIdleTask(task: () => void, deps: unknown[], intervalMs: number) {
  const taskRef = useRef(task);
  taskRef.current = task;

  useEffect(() => {
    const w = window as IdleWindow;
    let cancelled = false;
    let timer = 0;
    let idleId = 0;

    const run = () => {
      if (cancelled) return;

      const execute = () => {
        if (cancelled) return;
        taskRef.current();
      };

      if (typeof w.requestIdleCallback === 'function') {
        idleId = w.requestIdleCallback(() => execute(), { timeout: intervalMs });
      } else {
        timer = window.setTimeout(execute, 0);
      }
    };

    run();
    const interval = window.setInterval(run, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (timer) window.clearTimeout(timer);
      if (idleId && typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(idleId);
      }
    };
  }, [intervalMs, ...deps]);
}
