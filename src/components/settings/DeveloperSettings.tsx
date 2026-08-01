import { useState, useEffect } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Database,
  Code,
  RefreshCw,
  Clipboard,
  Check,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { bridgeFetch } from '@/lib/bridgeConfig';
import { pluginManager } from '../../core/plugins/PluginManager';
import { dataBus } from '../../core/data/DataBus';
import { SettingsSection } from './SettingsSection';

type FeatureRealityStatus = 'verified' | 'source-backed' | 'partial' | 'unconfigured' | 'missing';

type FeatureRealityItem = {
  id: string;
  label: string;
  status: FeatureRealityStatus;
  evidence: string[];
  limitation?: string;
};

type RepositoryRealityItem = {
  id: string;
  label: string;
  status: FeatureRealityStatus;
  path: string;
  missing_files: string[];
};

type FeatureRealityLedger = {
  status: string;
  integration_score: number;
  generated_at: string;
  repositories: RepositoryRealityItem[];
  features: FeatureRealityItem[];
  runtime_report_status: string;
  partial_reasons: string[];
  not_100_reason: string;
};

const realityStatusClass: Record<FeatureRealityStatus, string> = {
  verified: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  'source-backed': 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
  partial: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  unconfigured: 'border-zinc-300/15 bg-white/5 text-white/45',
  missing: 'border-red-400/20 bg-red-400/10 text-red-100'
};

export function DeveloperSettings() {
  const forceFallback = useUIStore((s) => s.forceFallback);
  const setForceFallback = useUIStore((s) => s.setForceFallback);
  const engineUrlOverride = useUIStore((s) => s.engineUrlOverride);
  const setEngineUrlOverride = useUIStore((s) => s.setEngineUrlOverride);

  const [copied, setCopied] = useState(false);
  const [busHistory, setBusHistory] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [featureLedger, setFeatureLedger] = useState<FeatureRealityLedger | null>(null);
  const [featureLedgerStatus, setFeatureLedgerStatus] = useState('checking');

  // Poll DataBus event log history periodically for live updates
  useEffect(() => {
    const updateHistory = () => {
      setBusHistory([...dataBus.history]);
    };
    updateHistory();
    const interval = setInterval(updateHistory, 1000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    async function refreshFeatureLedger() {
      setFeatureLedgerStatus('checking');
      try {
        const response = await bridgeFetch('/api/integration/status');
        if (!response.ok) {
          throw new Error(`Bridge returned ${response.status}`);
        }
        const payload = (await response.json()) as FeatureRealityLedger;
        if (!active) return;
        setFeatureLedger(payload);
        setFeatureLedgerStatus('online');
      } catch (error) {
        if (!active) return;
        setFeatureLedgerStatus(error instanceof Error ? error.message : 'offline');
      }
    }

    refreshFeatureLedger();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Active Plugins list
  const plugins = pluginManager.getAllPlugins();

  const handleCopyState = () => {
    const state = useUIStore.getState();
    // Exclude big noisy objects like message sessions for brevity
    const safeState = {
      activePalette: state.activePalette,
      aiModel: state.aiModel,
      audioFeedback: state.audioFeedback,
      particleEffects: state.particleEffects,
      launcherDismissed: state.launcherDismissed,
      interactionMode: state.interactionMode,
      scanlineOverlay: state.scanlineOverlay,
      cameraSensitivity: state.cameraSensitivity,
      showBorders: state.showBorders,
      showTerrain: state.showTerrain,
      showRoads: state.showRoads,
      activeSatelliteId: state.activeSatelliteId,
      satelliteCategories: state.satelliteCategories,
      satelliteSettings: state.satelliteSettings,
      forceFallback: state.forceFallback,
      engineUrlOverride: state.engineUrlOverride,
      personalisation: state.personalisation
    };

    navigator.clipboard
      .writeText(JSON.stringify(safeState, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Failed to copy state:', err));
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: CORE SIMULATION & API */}
      <SettingsSection title="Execution & Core Simulation API">
        <div className="space-y-4">
          {/* WebGL Force-Fallback Toggle */}
          <div
            onClick={() => setForceFallback(!forceFallback)}
            className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert
                size={16}
                className={`transition-colors ${forceFallback ? 'text-primary animate-pulse' : 'text-white/20'}`}
              />
              <div className="flex flex-col">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider transition-colors ${forceFallback ? 'text-white/80' : 'text-white/30'}`}
                >
                  Force 2D Fallback Mode
                </span>
                <span className="text-[8px] text-white/30 font-mono mt-0.5">
                  Bypasses WebGL context and runs pure 2D canvas simulation.
                </span>
              </div>
            </div>
            <div>
              {forceFallback ? (
                <ToggleRight className="h-6 w-6 text-primary" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-white/20" />
              )}
            </div>
          </div>

          {/* Custom API Endpoint Override */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/40 block">
              Data Engine API Endpoint URL Override
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={engineUrlOverride}
                onChange={(e) => setEngineUrlOverride(e.target.value)}
                placeholder="http://127.0.0.1:8001 or ws://127.0.0.1:5000/stream"
                className="flex-1 rounded-lg bg-black/30 border border-white/5 px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary/35 font-mono"
              />
              {engineUrlOverride && (
                <button
                  type="button"
                  onClick={() => setEngineUrlOverride('')}
                  className="px-3 py-2 text-[9px] font-mono uppercase rounded bg-white/5 text-white/40 hover:bg-white/10"
                >
                  Reset
                </button>
              )}
            </div>
            <span className="text-[8px] text-white/20 block font-mono">
              Overrides both bridge REST calls and plugin WS streams. Empty uses VITE_BRIDGE_URL for REST and the
              WorldWideView data-engine default for plugin streams.
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* SECTION 2: SOURCE-BACKED FEATURE REALITY LEDGER */}
      <SettingsSection title="Feature Reality Ledger">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="space-y-1">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-white/75">
                <Activity size={14} className="text-primary" />
                Runtime evidence, not marketing copy
              </span>
              <p className="max-w-2xl font-mono text-[8px] leading-relaxed text-white/35">
                This ledger reports verified, source-backed, partial, unconfigured, and missing surfaces from the Bridge
                runtime. It is intentionally not scored as 100 while external credentials or live provider checks are
                missing.
              </p>
            </div>
            <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-primary">
              {featureLedger ? `${featureLedger.integration_score}/100` : featureLedgerStatus}
            </div>
          </div>

          {featureLedger && (
            <>
              <div className="grid gap-2 md:grid-cols-3">
                {featureLedger.repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className={`rounded-xl border p-3 font-mono text-[8px] leading-relaxed ${realityStatusClass[repo.status] || realityStatusClass.partial}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold uppercase tracking-wider">{repo.label}</span>
                      <span className="uppercase">{repo.status}</span>
                    </div>
                    <div className="mt-2 truncate text-white/45">{repo.path}</div>
                    {repo.missing_files.length > 0 && (
                      <div className="mt-1 text-red-200/75">Missing: {repo.missing_files.join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {featureLedger.features.map((feature) => (
                  <div
                    key={feature.id}
                    className={`rounded-xl border p-3 font-mono text-[8px] leading-relaxed ${realityStatusClass[feature.status] || realityStatusClass.partial}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold uppercase tracking-wider">{feature.label}</span>
                      <span className="uppercase">{feature.status}</span>
                    </div>
                    <div className="mt-2 text-white/45">Evidence: {feature.evidence.join(' / ')}</div>
                    {feature.limitation && <div className="mt-1 text-white/55">{feature.limitation}</div>}
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 font-mono text-[8px] uppercase leading-relaxed text-amber-100/75">
                <div className="font-bold">Not 100 reason</div>
                <div>{featureLedger.not_100_reason}</div>
                {featureLedger.partial_reasons.length > 0 && (
                  <div>Runtime partials: {featureLedger.partial_reasons.join(', ')}</div>
                )}
              </div>
            </>
          )}
        </div>
      </SettingsSection>

      {/* SECTION 2: ACTIVE PLUGIN INSPECTOR */}
      <SettingsSection title="Active Plugin Registry Inspector">
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/5">
          <table className="w-full text-left font-mono text-[9px] border-collapse">
            <thead>
              <tr className="bg-black/35 text-white/40 border-b border-white/5">
                <th className="p-2.5 uppercase tracking-wider">Plugin Name</th>
                <th className="p-2.5 uppercase tracking-wider">Category</th>
                <th className="p-2.5 uppercase tracking-wider">Status</th>
                <th className="p-2.5 uppercase tracking-wider text-right">Entities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {plugins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-white/20 uppercase">
                    No active plugins loaded.
                  </td>
                </tr>
              ) : (
                plugins.map((managed) => (
                  <tr key={managed.plugin.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-2.5 font-bold flex items-center gap-1.5 min-w-0">
                      <Code size={12} className="text-primary shrink-0" />
                      <span className="truncate">{managed.plugin.name}</span>
                    </td>
                    <td className="p-2.5 uppercase text-[8px] text-white/40">{managed.plugin.category}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-[4px] text-[7px] font-bold uppercase ${
                          managed.enabled
                            ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/10'
                            : 'bg-white/5 text-white/30 border border-white/5'
                        }`}
                      >
                        {managed.enabled ? 'ACTIVE' : 'IDLE'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-bold text-white/90">{managed.entities.length}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SettingsSection>

      {/* SECTION 3: DATABUS EVENT STREAM LOG */}
      <section className="space-y-4">
        <h3 className="text-[10px] uppercase tracking-widest text-primary font-bold border-b border-primary/20 pb-1 flex justify-between items-center">
          <span>DataBus Live Event Stream Log</span>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-white/40 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
            title="Refresh stream log history"
            aria-label="Refresh DataBus stream log history"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
          </button>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/5 max-h-[220px] overflow-y-auto scroller">
          <table className="w-full text-left font-mono text-[9px] border-collapse">
            <thead>
              <tr className="bg-black/35 text-white/40 border-b border-white/5 sticky top-0 z-10">
                <th className="p-2.5 uppercase tracking-wider">Timestamp</th>
                <th className="p-2.5 uppercase tracking-wider">Event ID</th>
                <th className="p-2.5 uppercase tracking-wider">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {busHistory.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-white/20 uppercase">
                    No DataBus events logged yet.
                  </td>
                </tr>
              ) : (
                busHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-2.5 text-white/30 min-w-[70px]">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-2.5 font-bold text-primary flex items-center gap-1.5">
                      <Activity size={10} className="text-primary shrink-0" />
                      <span>{item.event}</span>
                    </td>
                    <td
                      className="p-2.5 text-[8px] max-w-[200px] truncate text-white/40 hover:text-white/80 select-all"
                      title={JSON.stringify(item.data)}
                    >
                      {JSON.stringify(item.data)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: ZUSTAND STATE DUMP */}
      <SettingsSection title="Local Zustand State Sync Dump">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase text-white/80 font-bold flex items-center gap-1.5">
              <Database size={14} className="text-primary" />
              Copy Local State Dump
            </span>
            <span className="text-[8px] text-white/30 font-mono mt-0.5">
              Copies core Zustand active parameters to clipboard in raw JSON layout.
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyState}
            className="flex min-h-11 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/20 px-3 py-2 font-mono text-[9px] uppercase text-primary transition-all cursor-pointer hover:bg-primary-hover hover:text-white"
            aria-label="Copy local Zustand state dump"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Clipboard size={12} />
                <span>Copy Dump</span>
              </>
            )}
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
