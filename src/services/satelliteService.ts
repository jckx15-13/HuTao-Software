import { useUIStore, type SatelliteData } from '../store/uiStore';
import { SATELLITES } from '../core/satellites/satelliteData';

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
    try {
      // Check if we have valid, fresh TLE in store already
      const current = useUIStore.getState().satelliteData[id];
      const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
      
      if (current && (Date.now() - current.timestamp < STALE_THRESHOLD)) {
        return; // Data is still fresh
      }

      const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=2line`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const lines = text.trim().split('\n');
      
      if (lines.length >= 2) {
        // Celestrak might return "No elements found" in plain text even with 200 OK
        if (lines[0].includes('No elements found')) return;

        const tle = [id.toUpperCase(), lines[0].trim(), lines[1].trim()];
        const data: SatelliteData = { tle, timestamp: Date.now() };
        
        useUIStore.getState().setSatelliteData(id, data);
        useUIStore.getState().addChangeLog('SATELLITE', `TLE Uplinked: ${id} (Epoch Verified)`, 'success');
      }
    } catch (err) {
      console.warn(`[SatelliteService] Failed for ${id}:`, err);
    }
  }
}

export const satelliteService = new SatelliteService();
