import { useEffect, type RefObject } from 'react';

export function useAutoScroll(ref: RefObject<HTMLElement | null>, dependencies: unknown[]) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    node.scrollTop = node.scrollHeight;
  }, dependencies);

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
