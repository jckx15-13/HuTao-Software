declare const __SILVER_WOLF_ASTRONOMY_URL__: string | undefined;

/** Astronomy needs a Python service; GitHub Pages can only serve static files. */
export function astronomyFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = typeof __SILVER_WOLF_ASTRONOMY_URL__ === 'undefined'
    ? '/api/astronomy'
    : __SILVER_WOLF_ASTRONOMY_URL__;
  if (base === 'off') {
    return Promise.reject(new Error('Observer calculations require an astronomy service. Configure VITE_ASTRONOMY_URL when deploying.'));
  }
  return fetch(`${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, init);
}
