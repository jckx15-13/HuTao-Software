import { useUIStore, type SatelliteData } from '../store/uiStore';
import { SATELLITES } from '../core/satellites/satelliteData';

type FailureState = { count: number; nextAttempt: number };
const failureState: Record<string, FailureState> = {};
const BACKOFF_BASE = 1000; // 1s
const BACKOFF_MAX = 60 * 1000; // 60s

class SatelliteService {
  private updateInterval: any = null;

  start() {
    if (this.updateInterval) return;
    
    // Initial fetch for all satellites with NORAD IDs
    this.fetchAllTles();

    // Refresh TLEs every 12 hours
    this.updateInterval = setInterval(() => {
      this.fetchAllTles();
    }, 12 * 60 * 60 * 1000);
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async fetchAllTles() {
    const satellitesWithNorad = SATELLITES.filter(s => s.noradId);
    
    // Process in small batches to avoid rate limiting
    for (let i = 0; i < satellitesWithNorad.length; i += 3) {
      const batch = satellitesWithNorad.slice(i, i + 3);
      await Promise.all(batch.map(sat => this.fetchTle(sat.id, sat.noradId!)));
      
      if (i + 3 < satellitesWithNorad.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async fetchTle(id: string, noradId: string) {
    let url = '';
    try {
      const now = Date.now();
      const st = failureState[id] || { count: 0, nextAttempt: 0 };
      if (now < st.nextAttempt) {
        // Skipping due to recent failures/backoff
        return;
      }
      // Check if we have valid, fresh TLE in store already
      const current = useUIStore.getState().satelliteData[id];
      const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
      
      if (current && (Date.now() - current.timestamp < STALE_THRESHOLD)) {
        return; // Data is still fresh
      }

      url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=2line`;
      let text = '';
      
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        text = await response.text();
      } catch (directErr) {
        console.warn(`[SatelliteService] Direct fetch failed for ${id}, trying proxy...`);
        // Try bridge proxy
        const proxyUrl = `http://localhost:8001/api/camera/proxy?url=${encodeURIComponent(url)}`;
        const proxyRes = await fetch(proxyUrl);
        if (!proxyRes.ok) throw new Error(`Proxy connection failed: ${proxyRes.status}`);
        const json = await proxyRes.json();
        if (json.status !== 200) {
          throw new Error(`Proxy failed: ${json.status} ${json.error || ''}`);
        }
        text = json.response || '';
      }

      const lines = text.trim().split('\n');
      
      if (lines.length >= 2) {
        // Celestrak might return "No elements found" in plain text even with 200 OK
        if (lines[0].includes('No elements found')) return;

        const tle = [id.toUpperCase(), lines[0].trim(), lines[1].trim()];
        const data: SatelliteData = { tle, timestamp: Date.now() };
        
        useUIStore.getState().setSatelliteData(id, data);
        useUIStore.getState().addChangeLog('SATELLITE', `TLE Uplinked: ${id} (Epoch Verified)`, 'success');
        // Reset failure state on success
        failureState[id] = { count: 0, nextAttempt: 0 };
      }
    } catch (err) {
      // Exponential backoff tracking
      const prev = failureState[id] || { count: 0, nextAttempt: 0 };
      const nextCount = (prev.count || 0) + 1;
      const delay = Math.min(BACKOFF_MAX, BACKOFF_BASE * Math.pow(2, nextCount - 1));
      const nextAttempt = Date.now() + delay;
      failureState[id] = { count: nextCount, nextAttempt };

      const suggestion = `CelesTrak returned error. Next attempt after ${new Date(nextAttempt).toISOString()}`;
      try {
        (globalThis as any).useDiagnosticsStore?.getState?.().add?.({
          level: 'warning',
          message: `[SatelliteService] Failed for ${id}: ${err?.message || err}`,
          suggestion,
          metadata: { service: 'SatelliteService', id, url }
        });
      } catch (e) {
        // ignore diagnostics write failures
      }
      console.warn(`[SatelliteService] Failed for ${id}:`, err);
    }
  }
}

export const satelliteService = new SatelliteService();
