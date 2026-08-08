import { useEffect, useRef } from 'react';

export function resolveChromeTopAnchor(headerBottom?: number | null, switcherBottom?: number | null): number {
  const safeHeaderBottom = Number.isFinite(headerBottom) ? Math.max(headerBottom ?? 0, 0) : 0;
  const safeSwitcherBottom = Number.isFinite(switcherBottom) ? Math.max(switcherBottom ?? 0, 0) : 0;
  return Math.round(Math.max(safeHeaderBottom, safeSwitcherBottom));
}

/**
 * Publishes `--chrome-top-y` on `document.documentElement`: the real,
 * measured Y coordinate directly below the top chrome stack (workspace
 * workspace header. The mode-switcher pill is deliberately excluded because
 * it is a floating widget that may overlay the workspace when opened.
 *
 * Consumers read the measured header boundary instead of re-deriving it.
 *
 * Written to `document.documentElement` (not a local element) so it's
 * visible across `CenterPanel`'s `fixed inset-0` subtree and any
 * Suspense/lazy boundary in between — a scoped CSS custom property on a
 * local `div` would not reach those descendants reliably.
 */
export function useChromeTopAnchor(modeSwitcherRef: React.RefObject<HTMLElement | null>) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const publish = () => {
      if (!active) return;
      const header = document.getElementById('workspace-header');
      const headerRect = header?.getBoundingClientRect();
      // The mode switcher is intentionally excluded: it is a floating widget,
      // so opening it must overlay the workspace rather than resize content.
      const anchorPx = resolveChromeTopAnchor(headerRect?.bottom);

      document.documentElement.style.setProperty('--chrome-top-y', `${anchorPx}px`);
      document.documentElement.style.setProperty('--chrome-parent-top-y', `${Math.max(headerRect?.bottom ?? 0, 0)}px`);
    };

    const scheduleRaf = () => {
      if (!active) return;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        publish();
      });
    };

    publish();
    scheduleRaf();

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleRaf) : null;
    if (observer) {
      const header = document.getElementById('workspace-header');
      if (header) observer.observe(header);
    }
    window.addEventListener('resize', scheduleRaf, { passive: true });

    return () => {
      active = false;
      observer?.disconnect();
      window.removeEventListener('resize', scheduleRaf);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [modeSwitcherRef]);
}
