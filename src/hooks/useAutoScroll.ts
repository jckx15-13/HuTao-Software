import { useEffect, useRef, useMemo, type RefObject } from 'react';

export function useAutoScroll(ref: RefObject<HTMLElement | null>, dependencies: unknown[]) {
  // Memoize the dependency length to use as a stable trigger
  const depLength = dependencies.length;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    node.scrollTop = node.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, depLength, ...dependencies]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new MutationObserver(() => {
      node.scrollTop = node.scrollHeight;
    });

    observer.observe(node, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [ref]);
}
