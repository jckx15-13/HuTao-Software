import { useCallback, useEffect, useRef } from 'react';
import { loadEmbeddedCollection } from '@/lib/wwt/researchProtocol';

export function useEmbeddedWwtCollections(generation: number) {
  const cancel = useRef<() => void>(() => {});
  useEffect(() => () => cancel.current(), [generation]);
  return useCallback((frame: HTMLIFrameElement, url: string, onLoaded: () => void, onError: () => void) => {
    cancel.current();
    cancel.current = loadEmbeddedCollection(frame, url, onLoaded, onError);
  }, []);
}
