import { useEffect, useRef, useState } from 'react';
import type { WwtEngineSession } from '@/lib/wwt/engineSession';
import { loadWwtCollection } from '@/lib/wwt/collectionLoader';

export function WWTCollections({ session, onLoaded }: { session: WwtEngineSession | null; onLoaded: () => void }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);
  const cleanup = useRef<() => void>(() => {});
  useEffect(() => () => cleanup.current(), [session]);

  return <details className="obs-collections">
    <summary>Load WTML collection</summary>
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!session) return;
      cleanup.current();
      setPending(true); setStatus('Waiting for WWT to load the collection…');
      try {
        cleanup.current = loadWwtCollection(session.api, url, () => {
          setPending(false); setStatus('Collection loaded. Its sky images are now available in the Survey list.'); onLoaded();
        }, (message) => { setPending(false); setStatus(message); });
      } catch (error) { setPending(false); setStatus(error instanceof Error ? error.message : 'Collection could not be loaded.'); }
    }}>
      <label>Collection URL<input aria-label="WTML collection URL" type="url" required placeholder="https://example.org/collection.wtml" value={url} onChange={(event) => setUrl(event.target.value)}/></label>
      <button type="submit" disabled={!session || pending}>Load collection</button>
    </form>
    <p role="status">{status || 'Online collections require a server that allows browser access. Image credits remain with their providers.'}</p>
  </details>;
}
