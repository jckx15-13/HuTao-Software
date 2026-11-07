import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { isRecord, readWwtTelemetry, WWT_ORIGIN, type WwtCommand } from '@/lib/wwt/researchApp';

const CONNECT_TIMEOUT_MS = 45_000;
const COLLECTION_TIMEOUT_MS = 30_000;

type Connection = 'connecting' | 'ready' | 'unavailable';
type CollectionStatus = 'idle' | 'loading' | 'loaded' | 'unconfirmed';

export function useWwtResearchApp(enabled: boolean) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadedFrame = useRef<HTMLIFrameElement | null>(null);
  const clientId = useId();
  const [attempt, setAttempt] = useState(0);
  const [connection, setConnection] = useState<Connection>('connecting');
  const [telemetry, setTelemetry] = useState<ReturnType<typeof readWwtTelemetry>>(null);
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatus>('idle');
  const nextRequest = useRef(0);
  const pendingCollection = useRef<{ threadId: string; timeout: number } | null>(null);
  const sessionId = `${clientId}-${attempt}`;

  const send = useCallback((command: WwtCommand) => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return false;
    frame.postMessage(command, WWT_ORIGIN);
    return true;
  }, []);

  const clearCollection = useCallback(() => {
    if (!pendingCollection.current) return;
    window.clearTimeout(pendingCollection.current.timeout);
    pendingCollection.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let ready = false;
    let lastTelemetryAt = -Infinity;
    const ping = () => {
      if (loadedFrame.current && loadedFrame.current === iframeRef.current) {
        send({ type: 'wwt_ping_pong', threadId: sessionId, sessionId });
      }
    };
    const interval = window.setInterval(ping, 500);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      window.removeEventListener('message', receiveMessage);
      setConnection('unavailable');
    }, CONNECT_TIMEOUT_MS);
    const stopConnecting = () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };

    function receiveMessage(event: MessageEvent<unknown>) {
      if (event.origin !== WWT_ORIGIN || event.source !== iframeRef.current?.contentWindow) return;
      const message = event.data;
      if (!isRecord(message)) return;

      if (!ready) {
        if (message.type === 'wwt_ping_pong' && message.threadId === sessionId && message.sessionId === sessionId) {
          ready = true;
          stopConnecting();
          setConnection('ready');
        }
        return;
      }

      if (message.event === 'load_image_collection_completed' &&
        pendingCollection.current && message.threadId === pendingCollection.current.threadId) {
        clearCollection();
        setCollectionStatus('loaded');
        return;
      }

      if (message.sessionId !== sessionId || performance.now() - lastTelemetryAt < 100) return;
      const view = readWwtTelemetry(message);
      if (!view) return;
      lastTelemetryAt = performance.now();
      setTelemetry(view);
    }

    window.addEventListener('message', receiveMessage);
    return () => {
      window.removeEventListener('message', receiveMessage);
      stopConnecting();
      clearCollection();
    };
  }, [clearCollection, enabled, send, sessionId]);

  function onFrameLoad(frame: HTMLIFrameElement) {
    loadedFrame.current = frame;
  }

  function retry() {
    clearCollection();
    loadedFrame.current = null;
    setCollectionStatus('idle');
    setTelemetry(null);
    setConnection('connecting');
    setAttempt((current) => current + 1);
  }

  function loadCollection(url: string) {
    if (connection !== 'ready' || pendingCollection.current) return;
    const threadId = `${sessionId}-collection-${++nextRequest.current}`;
    if (!send({ event: 'load_image_collection', url, threadId })) return;
    setCollectionStatus('loading');
    const timeout = window.setTimeout(() => {
      pendingCollection.current = null;
      setCollectionStatus('unconfirmed');
    }, COLLECTION_TIMEOUT_MS);
    pendingCollection.current = { threadId, timeout };
  }

  return { attempt, collectionStatus, connection, iframeRef, loadCollection, onFrameLoad, retry, send, telemetry };
}
