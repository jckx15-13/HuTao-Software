/** Restrict embedded WWT messages to the actual frame and its configured origin. */
export function isTrustedWwtMessage(event: MessageEvent, frame: HTMLIFrameElement): boolean {
  try {
    return event.source === frame.contentWindow && event.origin === new URL(frame.src).origin;
  } catch { return false; }
}

/** onLoad only confirms HTML loading; WWT's documented ping/pong confirms its API. */
export function connectWwtResearchApp(frame: HTMLIFrameElement, onReady: () => void): () => void {
  const origin = new URL(frame.src).origin;
  const threadId = `silver-wolf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ping = () => frame.contentWindow?.postMessage({ type: 'wwt_ping_pong', threadId, sessionId: threadId }, origin);
  const receive = (event: MessageEvent) => {
    if (!isTrustedWwtMessage(event, frame) || event.data?.type !== 'wwt_ping_pong' || event.data.threadId !== threadId) return;
    cleanup(); onReady();
  };
  const cleanup = () => { clearInterval(timer); window.removeEventListener('message', receive); };
  const timer = setInterval(ping, 500);
  window.addEventListener('message', receive);
  ping();
  return cleanup;
}

export function readWwtView(data: unknown): { type: 'wwt_view_state'; ra: number; dec: number; fov: number } | null {
  if (!data || typeof data !== 'object') return null;
  const view = data as Record<string, unknown>;
  const ra = view.raRad, dec = view.decRad, fov = view.fovDeg;
  if (view.type !== 'wwt_view_state' || typeof ra !== 'number' || typeof dec !== 'number' || typeof fov !== 'number' ||
      ![ra, dec, fov].every(Number.isFinite) || Math.abs(dec) > Math.PI / 2 || fov <= 0 || fov > 360) return null;
  return { type: 'wwt_view_state', ra: ((ra * 180 / Math.PI) % 360 + 360) % 360, dec: dec * 180 / Math.PI, fov };
}

export function loadEmbeddedCollection(frame: HTMLIFrameElement, url: string, onLoaded: () => void, onError: () => void): () => void {
  const threadId = `collection-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const origin = new URL(frame.src).origin;
  const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', receive); };
  const receive = (event: MessageEvent) => {
    if (!isTrustedWwtMessage(event, frame) || event.data?.event !== 'load_image_collection_completed' ||
        event.data.threadId !== threadId || event.data.url !== url) return;
    cleanup(); onLoaded();
  };
  const timer = setTimeout(() => { cleanup(); onError(); }, 45000);
  window.addEventListener('message', receive);
  try { frame.contentWindow?.postMessage({ event: 'load_image_collection', url, threadId }, origin); }
  catch (error) { cleanup(); throw error; }
  return cleanup;
}
