import type { ScriptInterface } from '@wwtelescope/engine';

export function validateCollectionUrl(value: string): string {
  const url = new URL(value.trim());
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) ||
      url.username || url.password || !url.pathname.toLowerCase().endsWith('.wtml')) {
    throw new Error('Use an HTTPS .wtml collection URL, or HTTP on localhost.');
  }
  return url.href;
}

/** A load request is successful only after the engine acknowledges that URL. */
export function loadWwtCollection(
  api: ScriptInterface, input: string,
  onLoaded: () => void, onError: (message: string) => void,
): () => void {
  const url = validateCollectionUrl(input);
  let active = true;
  const cleanup = () => {
    active = false;
    clearTimeout(timer);
    api.remove_collectionLoaded(loaded);
  };
  const loaded: Parameters<ScriptInterface['add_collectionLoaded']>[0] = (_sender, args) => {
    if (!active || args.get_url() !== url) return;
    cleanup();
    onLoaded();
  };
  const timer = setTimeout(() => {
    if (!active) return;
    cleanup();
    onError('WWT did not confirm the collection. Check the URL, connection and server CORS policy, then retry.');
  }, 45000);
  api.add_collectionLoaded(loaded);
  try { api.loadImageCollection(url); }
  catch (error) { cleanup(); throw error; }
  return cleanup;
}
