import { useUIStore, type SatelliteData } from '../store/uiStore';
import { useDiagnosticsStore } from '../store/diagnosticsStore';
import { SATELLITES } from '../core/satellites/satelliteData';
import { bridgeUrl } from '../lib/bridgeConfig';

type FailureState = { count: number; nextAttempt: number };
const failureState: Record<string, FailureState> = {};
const BACKOFF_BASE = 1000; // 1s
const BACKOFF_MAX = 60 * 1000; // 60s
const GLOBAL_FAILURE_THRESHOLD = 3;
const GLOBAL_BACKOFF_MS = 5 * 60 * 1000;

let liveTleUnavailableUntil = 0;
let liveTleFallbackNoticeAt = 0;
type TleFetchResult = "fresh" | "success" | "skipped" | "failed";

class SatelliteService {
  private updateInterval: any = null;

  start() {
    if (this.updateInterval) return;

    // Detect if running in headless test/fallback mode
    const isHeadless = typeof window !== 'undefined' && (
      /HeadlessChrome/i.test(navigator.userAgent) ||
      navigator.webdriver ||
      window.location.search.includes('fallback')
    );

    if (isHeadless) {
      console.log('[SatelliteService] Headless environment detected. Skipping live TLE fetches.');
      return;
    }

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
    if (Date.now() < liveTleUnavailableUntil) {
      this.reportLiveTleFallback(
        `Live satellite TLE updates are paused until ${new Date(liveTleUnavailableUntil).toISOString()}; using catalog orbit fallback.`
      );
      return;
    }

    const satellitesWithNorad = SATELLITES.filter(s => s.noradId);
    let consecutiveFailures = 0;

    // Process in small batches to avoid rate limiting
    for (let i = 0; i < satellitesWithNorad.length; i += 3) {
      const batch = satellitesWithNorad.slice(i, i + 3);
      const results = await Promise.all(batch.map(sat => this.fetchTle(sat.id, sat.noradId!)));
      const failed = results.filter(result => result === "failed").length;
      consecutiveFailures = failed === results.length
        ? consecutiveFailures + failed
        : 0;

      if (consecutiveFailures >= GLOBAL_FAILURE_THRESHOLD) {
        liveTleUnavailableUntil = Date.now() + GLOBAL_BACKOFF_MS;
        this.reportLiveTleFallback(
          "Live satellite TLE updates are unavailable through both direct CelesTrak and the local proxy. The globe is using catalog orbit fallback until the dependency recovers."
        );
        return;
      }

      if (i + 3 < satellitesWithNorad.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async fetchTle(id: string, noradId: string): Promise<TleFetchResult> {
    let url = '';
    try {
      const now = Date.now();
      const st = failureState[id] || { count: 0, nextAttempt: 0 };
      if (now < st.nextAttempt) {
        // Skipping due to recent failures/backoff
        return "skipped";
      }
      // Check if we have valid, fresh TLE in store already
      const current = useUIStore.getState().satelliteData[id];
      const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

      if (current && (Date.now() - current.timestamp < STALE_THRESHOLD)) {
        return "fresh"; // Data is still fresh
      }

      url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=2line`;
      let text = '';

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        text = await response.text();
      } catch (directErr) {
        // Try bridge proxy
        const proxyUrl = bridgeUrl(`/api/camera/proxy?url=${encodeURIComponent(url)}`);
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
        if (lines[0].includes('No elements found')) return "failed";

        const tle = [id.toUpperCase(), lines[0].trim(), lines[1].trim()];
        const data: SatelliteData = { tle, timestamp: Date.now() };

        useUIStore.getState().setSatelliteData(id, data);
        useUIStore.getState().addChangeLog('SATELLITE', `TLE Uplinked: ${id} (Epoch Verified)`, 'success');
        // Reset failure state on success
        failureState[id] = { count: 0, nextAttempt: 0 };
        return "success";
      }

      return "failed";
    } catch (err) {
      // Exponential backoff tracking
      const prev = failureState[id] || { count: 0, nextAttempt: 0 };
      const nextCount = (prev.count || 0) + 1;
      const delay = Math.min(BACKOFF_MAX, BACKOFF_BASE * Math.pow(2, nextCount - 1));
      const nextAttempt = Date.now() + delay;
      failureState[id] = { count: nextCount, nextAttempt };
      return "failed";
    }
  }

  private reportLiveTleFallback(message: string) {
    const now = Date.now();
    if (now - liveTleFallbackNoticeAt < 60_000) return;
    liveTleFallbackNoticeAt = now;

    const suggestion = "Check CelesTrak reachability or the local proxy. Satellite positions remain visible using catalog orbit fallback.";
    try {
      useUIStore.getState().addChangeLog('SATELLITE', 'Live TLE unavailable; using catalog orbit fallback.', 'warning');
    } catch (e) {
      // ignore UI state failures
    }
    try {
      useDiagnosticsStore.getState().add({
        level: 'warning',
        message: `[SatelliteService] ${message}`,
        suggestion,
        metadata: { service: 'SatelliteService', fallback: 'catalog-orbit' }
      });
    } catch (e) {
      // ignore diagnostics write failures
    }
  }
}

export const satelliteService = new SatelliteService();
