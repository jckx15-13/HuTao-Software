import React, { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import {
  Activity,
  Database,
  Clock,
  Cpu,
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Server,
  Terminal,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import {
  ODYSSEUS_ASSET_ROOT,
  ODYSSEUS_ASSET_AUDIT,
  ODYSSEUS_ASSETS,
  ODYSSEUS_FEATURE_MAP,
  ODYSSEUS_SOURCE_DOC_ASSETS,
  getOdysseusAssetSummary,
  getOdysseusSourceAssetSummary
} from '@/assets/odysseusAssets';
import { bridgeUrl, getBridgeBaseUrl, getOdysseusCoreBaseUrl, isBridgeEnabled } from '@/lib/bridgeConfig';

const BRIDGE_TIMEOUT_MS = 4500;
const STATIC_ODYSSEUS_ASSETS = ODYSSEUS_ASSETS.filter((asset) => asset.type === 'image');
const MOTION_ODYSSEUS_ASSETS = ODYSSEUS_ASSETS.filter((asset) => asset.type === 'motion-demo');
const A11Y_ODYSSEUS_ASSETS = ODYSSEUS_SOURCE_DOC_ASSETS.filter((asset) => asset.kind === 'a11y-screenshot');

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), BRIDGE_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

interface ServerStatus {
  status: string;
  ready: boolean;
  sync_file: boolean;
  host: string;
  odysseus_health: string;
}

interface ModelEndpoint {
  id: string;
  name: string;
  provider: string;
  models: string[];
  base_url?: string;
  active?: boolean;
}

interface OdysseusTask {
  id: string;
  name: string;
  description?: string;
  frequency?: string;
  cron_expression?: string;
  status: 'active' | 'paused' | 'running' | 'failed' | 'idle';
  next_run?: string;
  last_run?: string;
  last_status?: string;
}

interface DBStats {
  tables?: Record<string, number>;
  collections?: Record<string, number>;
  total_notes?: number;
  total_tasks?: number;
  total_events?: number;
  rag_documents?: number;
}

export function OdysseusConsole() {
  const isFallbackRuntime = typeof window !== 'undefined' && window.location.search.includes('fallback');
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'models' | 'tasks' | 'memory' | 'source'>('status');
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [models, setModels] = useState<any>(null);
  const [tasks, setTasks] = useState<OdysseusTask[]>([]);
  const [dbStats, setDbStats] = useState<DBStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const setOdysseusReady = useUIStore((s) => s.setOdysseusReady);
  const engineUrlOverride = useUIStore((s) => s.engineUrlOverride);
  const bridgeBaseUrl = getBridgeBaseUrl();
  const odysseusCoreUrl = getOdysseusCoreBaseUrl();

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!isBridgeEnabled()) {
      setStatus(null);
      setModels(null);
      setTasks([]);
      setDbStats(null);
      setOdysseusReady(false);
      setError(
        'This is a static demo deployment with no Odysseus bridge. Bridge-backed models, tasks, and memory data are unavailable. Run the app locally with "node launch.js" to use the console.'
      );
      setLoading(false);
      return;
    }
    if (isFallbackRuntime) {
      setStatus(null);
      setModels(null);
      setTasks([]);
      setDbStats(null);
      setOdysseusReady(false);
      setError(
        'Odysseus bridge polling is paused in fallback audit mode. Bridge-backed models, tasks, and memory data are unavailable; copied source assets remain available in the Source tab, and no task or memory data was changed.'
      );
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Server Status
      const statusRes = await fetchWithTimeout(bridgeUrl('/status'));
      if (!statusRes.ok) throw new Error('Bridge unreachable');
      const statusData: ServerStatus = await statusRes.json();
      setStatus(statusData);
      setOdysseusReady(statusData.ready === true);

      if (statusData.ready) {
        // 2. Fetch Models
        const modelsRes = await fetchWithTimeout(bridgeUrl('/api/models'));
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          setModels(modelsData);
        }

        // 3. Fetch Tasks
        const tasksRes = await fetchWithTimeout(bridgeUrl('/api/tasks'));
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(Array.isArray(tasksData) ? tasksData : []);
        }

        // 4. Fetch DB Stats
        const dbRes = await fetchWithTimeout(bridgeUrl('/api/db/stats'));
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          setDbStats(dbData);
        } else {
          // Fallback to rag stats if db stats fails
          const ragRes = await fetchWithTimeout(bridgeUrl('/api/rag/stats'));
          if (ragRes.ok) {
            const ragData = await ragRes.json();
            setDbStats({ rag_documents: ragData.total_documents || 0 });
          }
        }
      } else {
        setModels(null);
        setTasks([]);
        setDbStats(null);
      }
    } catch (err: any) {
      setStatus(null);
      setModels(null);
      setTasks([]);
      setDbStats(null);
      setOdysseusReady(false);
      const message =
        err?.name === 'AbortError'
          ? 'The Odysseus bridge did not answer within 4.5 seconds.'
          : `The Odysseus bridge is not reachable at ${bridgeBaseUrl}.`;
      setError(
        `${message} Bridge-backed models, tasks, and memory data are unavailable. Copied source assets remain available in the Source tab, and no task or memory data was changed.`
      );
    } finally {
      setLoading(false);
    }
  }, [bridgeBaseUrl, engineUrlOverride, isFallbackRuntime, setOdysseusReady]);

  // Poll status on mount
  useEffect(() => {
    queueMicrotask(() => refreshAll());
    if (isFallbackRuntime || !isBridgeEnabled()) return;
    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, [refreshAll, isFallbackRuntime]);

  const handleTaskAction = async (taskId: string, action: 'run' | 'pause' | 'resume') => {
    setActionMessage(null);
    try {
      const res = await fetchWithTimeout(bridgeUrl(`/api/tasks/${taskId}/${action}`), {
        method: 'POST'
      });
      if (res.ok) {
        setActionMessage(`Task ${taskId} action '${action}' completed successfully.`);
        setTimeout(() => setActionMessage(null), 3000);
        // Refresh tasks
        refreshAll();
      } else {
        const errorText = await res.text();
        setError(`Failed to ${action} task: ${errorText}`);
      }
    } catch (err: any) {
      const message =
        err?.name === 'AbortError'
          ? 'The task request timed out before the Odysseus bridge answered.'
          : `The task request could not be sent: ${err.message}`;
      setError(
        `${message} Please confirm the bridge is running before retrying. No local task state was changed by Silver Wolf.`
      );
    }
  };

  const isOnline = status?.ready === true;

  return (
    <div className="flex flex-col h-full font-mono text-[10px] select-text">
      {/* Console Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-primary animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-primary">Odysseus Command Link</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
              isOnline
                ? 'bg-green-500/25 text-green-400 border border-green-500/30'
                : 'bg-red-500/25 text-red-400 border border-red-500/30'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-green-400 animate-ping' : 'bg-red-400'}`}
            />
            {isOnline ? 'LINK ACTIVE' : 'LINK OFFLINE'}
          </span>
          <button
            onClick={refreshAll}
            disabled={loading}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Force Odysseus telemetry sync"
            title="Force Telemetry Sync"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Odysseus Internal Tabs */}
      <div
        className="flex border-b border-white/5 bg-black/10 rounded-lg p-0.5 mb-3"
        role="tablist"
        aria-label="Odysseus console sections"
      >
        {(['status', 'models', 'tasks', 'memory', 'source'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeSubTab === tab}
            onClick={() => setActiveSubTab(tab)}
            className={`min-h-11 flex-1 rounded px-1 py-1 text-center text-[8px] font-bold uppercase tracking-wider transition-all duration-150 ${
              activeSubTab === tab ? 'bg-primary/20 text-primary font-bold shadow' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="relative mb-3 rounded border border-red-500/30 bg-red-950/20 p-2 pr-14 text-[9px] leading-relaxed text-red-400/80">
          <button
            type="button"
            onClick={() => setError(null)}
            className="absolute right-2 top-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded text-white/30 hover:bg-white/5 hover:text-white/70"
            aria-label="Dismiss Odysseus error message"
          >
            ×
          </button>
          <span className="font-bold mr-1">Needs attention:</span> {error}
        </div>
      )}

      {actionMessage && (
        <div className="p-2 mb-3 rounded bg-green-950/20 border border-green-500/30 text-green-400/80 leading-relaxed text-[9px] relative">
          <span className="font-bold mr-1">INFO:</span> {actionMessage}
        </div>
      )}

      {/* Main Console View */}
      <div className="flex-1 overflow-y-auto space-y-3 scroller pr-1">
        {/* Tab 1: Server Status */}
        {activeSubTab === 'status' && (
          <div className="space-y-3">
            <div className="glass-panel p-3 border border-white/5 bg-black/20 space-y-2 rounded-xl">
              <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold mb-1">SYSTEM LINK STATE</div>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="p-2 bg-black/30 border border-white/5 rounded">
                  <span className="text-white/30 block uppercase">Bridge Proxy</span>
                  <span className="break-all text-cyan-400 font-bold">{bridgeBaseUrl.replace(/^https?:\/\//, '')}</span>
                </div>
                <div className="p-2 bg-black/30 border border-white/5 rounded">
                  <span className="text-white/30 block uppercase">Odysseus core</span>
                  <span className="break-all text-cyan-400 font-bold">
                    {odysseusCoreUrl.replace(/^https?:\/\//, '')}
                  </span>
                </div>
                <div className="p-2 bg-black/30 border border-white/5 rounded">
                  <span className="text-white/30 block uppercase">Sync File State</span>
                  <span className={status?.sync_file ? 'text-green-400 font-bold' : 'text-yellow-500'}>
                    {status?.sync_file ? 'ACTIVE' : 'NOT FOUND'}
                  </span>
                </div>
                <div className="p-2 bg-black/30 border border-white/5 rounded">
                  <span className="text-white/30 block uppercase">Health Endpoint</span>
                  <span className={isOnline ? 'text-green-400 font-bold' : 'text-red-400'}>
                    {isOnline ? 'PASSING (200)' : 'UNREACHABLE'}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-3 border border-white/5 bg-black/20 space-y-2 rounded-xl">
              <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold mb-1">
                BRIDGE CONTEXT LOGS
              </div>
              <div className="bg-black/40 border border-white/5 rounded p-2 text-[8px] font-mono text-white/60 min-h-[80px] max-h-[150px] overflow-y-auto scroller">
                <div>[SYSTEM] Bridge Server target: {bridgeBaseUrl}</div>
                <div>[SYSTEM] Admin Authorization Token Generated.</div>
                {isOnline ? (
                  <>
                    <div className="text-green-400/80">[SYSTEM] Connection with Odysseus Engine Established.</div>
                    <div className="text-cyan-400/80">
                      [ODYSSEUS] Setup.py check verified. Skip Admin prompt active.
                    </div>
                    <div className="text-white/50">
                      [PROXY] Route bindings registered: /api/notes, /api/tasks, /api/calendar
                    </div>
                  </>
                ) : (
                  <div className="text-red-400/80">
                    [WARNING] Waiting for Odysseus subprocess lifespan initialization...
                  </div>
                )}
              </div>
            </div>

            {!isOnline && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/80 rounded-xl leading-relaxed text-[9px]">
                <h4 className="font-bold mb-1 uppercase">How to spawn Odysseus manually:</h4>
                <p className="mb-2">
                  If the bridge subprocess does not start automatically, verify python environment or run manually:
                </p>
                <code className="block bg-black/50 p-1.5 rounded text-[8px] border border-white/5 select-all">
                  cd odysseus && python -m uvicorn app:app --port 7000
                </code>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Model Registry */}
        {activeSubTab === 'models' && (
          <div className="space-y-3">
            {models ? (
              <div className="space-y-2.5">
                <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">DISCOVERED ENDPOINTS</div>

                {/* Active Endpoint List */}
                {models.endpoints &&
                  Array.isArray(models.endpoints) &&
                  models.endpoints.map((ep: any, index: number) => (
                    <div
                      key={index}
                      className="glass-panel p-2.5 border border-white/5 bg-black/20 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-1">
                        <span className="font-bold text-white/80">{ep.name || 'Unnamed Provider'}</span>
                        <span className="text-[8px] px-1 bg-primary/20 text-primary font-bold uppercase rounded">
                          {ep.provider || 'unknown'}
                        </span>
                      </div>
                      <div className="text-[8px] text-white/40 font-mono break-all">
                        Base: <span className="text-white/60">{ep.base_url || 'http://localhost:8000/v1'}</span>
                      </div>
                      <div className="space-y-1 mt-1.5">
                        <span className="text-[8.5px] text-white/30 block uppercase font-bold tracking-tighter">
                          Models List:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {ep.models && Array.isArray(ep.models) ? (
                            ep.models.map((model: string) => (
                              <span
                                key={model}
                                className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-white/70 font-mono text-[8px]"
                              >
                                {model}
                              </span>
                            ))
                          ) : (
                            <span className="text-white/30 italic">No models registered</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Raw fallback of models if format differs */}
                {!models.endpoints && (
                  <pre className="bg-black/30 border border-white/5 p-2 rounded max-h-[250px] overflow-y-auto text-[8px] text-white/50 scroller">
                    {JSON.stringify(models, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-white/20">
                <Cpu size={24} className="mb-2 opacity-15" />
                <span>No bridge-backed models available</span>
                <span className="mt-1 max-w-[220px] text-center text-[8px] leading-relaxed text-white/35">
                  Start the Odysseus bridge, then refresh this panel. Source assets can still be reviewed without the
                  bridge.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Tasks Scheduler */}
        {activeSubTab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[9px] text-white/30 uppercase tracking-wider font-bold">
              <span>ACTIVE SCHEDULES</span>
              <span className="text-white/50">{tasks.length} Total</span>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="glass-panel p-2.5 border border-white/5 bg-black/20 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white/80 truncate text-[9.5px]" title={task.name}>
                          {task.name}
                        </div>
                        {task.description && (
                          <div className="text-[8.5px] text-white/40 line-clamp-1 mt-0.5">{task.description}</div>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ml-2 uppercase ${
                          task.status === 'active' || task.status === 'running'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-white/5 text-white/30 border border-white/5'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-white/50 bg-black/30 p-1.5 rounded border border-white/5">
                      <div>
                        <span className="text-white/25 block uppercase text-[7.5px]">Schedule</span>
                        <span className="text-cyan-400 font-bold truncate block">
                          {task.frequency || task.cron_expression || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/25 block uppercase text-[7.5px]">Next Run</span>
                        <span className="truncate block">
                          {task.next_run ? new Date(task.next_run).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-1.5 border-t border-white/5">
                      <button
                        onClick={() => handleTaskAction(task.id, 'run')}
                        className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-primary transition-all duration-150 hover:bg-primary/20"
                        aria-label={`Run Odysseus task ${task.name}`}
                      >
                        <Play size={10} />
                        <span>Run Now</span>
                      </button>

                      {task.status === 'active' ? (
                        <button
                          onClick={() => handleTaskAction(task.id, 'pause')}
                          className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-yellow-500 transition-all duration-150 hover:bg-yellow-500/20"
                          aria-label={`Pause Odysseus task ${task.name}`}
                        >
                          <Pause size={10} />
                          <span>Pause</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTaskAction(task.id, 'resume')}
                          className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded border border-green-500/20 bg-green-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-green-500 transition-all duration-150 hover:bg-green-500/20"
                          aria-label={`Resume Odysseus task ${task.name}`}
                        >
                          <Play size={10} />
                          <span>Resume</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-white/20">
                <Clock size={24} className="mb-2 opacity-15" />
                <span>No bridge-backed tasks available</span>
                <span className="mt-1 max-w-[220px] text-center text-[8px] leading-relaxed text-white/35">
                  This may mean the bridge is offline or there are no scheduled tasks to show.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Memory & Vector DB Stats */}
        {activeSubTab === 'memory' && (
          <div className="space-y-3">
            <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold">DATABASE STATISTICS</div>

            {dbStats ? (
              <div className="space-y-3">
                <div className="glass-panel p-3 border border-white/5 bg-black/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-[8.5px]">
                    <Layers size={12} />
                    <span>Memory Collections</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {dbStats.tables && Object.keys(dbStats.tables).length > 0 ? (
                      Object.entries(dbStats.tables).map(([table, count]) => (
                        <div
                          key={table}
                          className="flex justify-between items-center font-mono py-1 border-b border-white/5 text-[9px] text-white/70"
                        >
                          <span className="uppercase text-white/40">{table.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-white">{count} items</span>
                        </div>
                      ))
                    ) : dbStats.collections && Object.keys(dbStats.collections).length > 0 ? (
                      Object.entries(dbStats.collections).map(([col, count]) => (
                        <div
                          key={col}
                          className="flex justify-between items-center font-mono py-1 border-b border-white/5 text-[9px] text-white/70"
                        >
                          <span className="uppercase text-white/40">{col.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-white">{count} items</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex justify-between items-center font-mono py-1 border-b border-white/5 text-[9px] text-white/70">
                          <span className="uppercase text-white/40">Total Notes</span>
                          <span className="font-bold text-white">{dbStats.total_notes ?? 0} items</span>
                        </div>
                        <div className="flex justify-between items-center font-mono py-1 border-b border-white/5 text-[9px] text-white/70">
                          <span className="uppercase text-white/40">Total Tasks</span>
                          <span className="font-bold text-white">{dbStats.total_tasks ?? 0} items</span>
                        </div>
                        <div className="flex justify-between items-center font-mono py-1 border-b border-white/5 text-[9px] text-white/70">
                          <span className="uppercase text-white/40">Calendar Events</span>
                          <span className="font-bold text-white">{dbStats.total_events ?? 0} items</span>
                        </div>
                      </>
                    )}

                    {dbStats.rag_documents !== undefined && (
                      <div className="flex justify-between items-center font-mono py-1 border-b border-white/5 text-[9px] text-white/70">
                        <span className="uppercase text-cyan-400">RAG Document Embeddings</span>
                        <span className="font-bold text-cyan-400">{dbStats.rag_documents} vectors</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-cyan-950/10 border border-cyan-500/20 text-cyan-400/80 rounded-xl leading-relaxed text-[8px] font-mono flex items-start gap-1.5">
                  <Database size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block mb-0.5">CHROMA DB VECTOR STORE</span>
                    Odysseus aggregates workspace files, notes, and browsing history. Data is tokenized and stored in a
                    local ChromaDB instance to allow semantic recall (RAG) during chat sessions.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-white/20">
                <Database size={24} className="mb-2 opacity-15" />
                <span>No bridge-backed memory data available</span>
                <span className="mt-1 max-w-[220px] text-center text-[8px] leading-relaxed text-white/35">
                  Silver Wolf is not reading local memory contents unless the Odysseus bridge provides aggregate stats.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Source-backed integration map */}
        {activeSubTab === 'source' && (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-primary/15 bg-black/30">
              <img
                src={`${ODYSSEUS_ASSET_ROOT}/docs/odysseus.jpg`}
                alt="Odysseus source project artwork"
                className="h-24 w-full object-cover opacity-80"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-primary">Copied Source Assets</div>
                <div className="mt-0.5 text-[8px] leading-relaxed text-white/55">{getOdysseusAssetSummary()}</div>
              </div>
            </div>

            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-[8px] leading-relaxed text-yellow-200/80">
              Odysseus source modules and demo assets are mapped here for provenance. Motion demo clips are copied but
              not autoplayed. Upstream static scripts are not executed inside Silver Wolf; functional actions must go
              through the local bridge.
            </div>

            <div className="space-y-2 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3">
              <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-wider text-cyan-200/80">
                <span>Accessibility Evidence</span>
                <span>{A11Y_ODYSSEUS_ASSETS.length} source screenshots</span>
              </div>
              <div className="text-[8px] leading-relaxed text-cyan-100/65">
                Copied Odysseus accessibility screenshots are visual evidence only. They do not certify Silver Wolf
                accessibility; use them to compare focus and login patterns before bridge-backed workflows are presented
                as complete.
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
                {A11Y_ODYSSEUS_ASSETS.map((asset) => (
                  <figure key={asset.path} className="overflow-hidden rounded-xl border border-white/5 bg-black/25">
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                      aria-label={`Open Odysseus accessibility source screenshot ${asset.path}`}
                      title={`Open ${asset.path}`}
                    >
                      <img
                        src={asset.url}
                        alt={`Copied Odysseus accessibility source screenshot ${asset.path}`}
                        className="h-28 w-full bg-black/30 object-contain"
                        loading="eager"
                        decoding="async"
                      />
                    </a>
                    <figcaption className="space-y-1 p-2">
                      <div className="truncate text-[8.5px] font-bold text-white/80">{asset.path}</div>
                      <div className="text-[7.5px] leading-relaxed text-white/45">
                        Source-only comparison artifact; keyboard, screen-reader, and Silver Wolf workflow accessibility
                        remain unverified here.
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-wider text-white/35">
                <span>Desktop Asset Inspection</span>
                <span>{STATIC_ODYSSEUS_ASSETS.length} static previews</span>
              </div>
              <div className="grid gap-2">
                {STATIC_ODYSSEUS_ASSETS.map((asset) => (
                  <figure key={asset.id} className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
                    <img
                      src={asset.url}
                      alt={asset.label}
                      className="h-28 w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                    <figcaption className="space-y-1 p-2">
                      <div className="truncate text-[9px] font-bold text-white/80">{asset.label}</div>
                      <div className="text-[7.5px] leading-relaxed text-white/45">{asset.intendedUse}</div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-amber-400/15 bg-amber-400/5 p-3">
              <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-wider text-amber-200/80">
                <span>Motion Demos</span>
                <span>{MOTION_ODYSSEUS_ASSETS.length} link-only</span>
              </div>
              <div className="text-[8px] leading-relaxed text-amber-100/65">
                Motion demos are copied from Odysseus but not embedded or autoplayed here, so they do not surprise users
                with movement or execute upstream app logic.
              </div>
              <div className="space-y-1">
                {MOTION_ODYSSEUS_ASSETS.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between gap-2 rounded border border-white/5 bg-black/20 px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[8.5px] font-bold text-white/70">{asset.label}</div>
                      <div className="truncate text-[7px] text-white/35">{asset.sourcePath}</div>
                    </div>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/80"
                      aria-label={`Open motion demo ${asset.label}`}
                      title={`Open motion demo ${asset.label}`}
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/35">Source Mirror</div>
                <div className="mt-1 text-[10px] font-bold text-white/85">
                  {ODYSSEUS_ASSET_AUDIT.copiedFileCount} files copied
                </div>
                <div className="mt-0.5 break-all text-[7.5px] text-white/40">{ODYSSEUS_ASSET_AUDIT.copiedRoot}</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/35">Media Coverage</div>
                <div className="mt-1 text-[10px] font-bold text-white/85">
                  {ODYSSEUS_ASSET_AUDIT.copiedMediaFileCount} media/a11y assets
                </div>
                <div className="mt-0.5 text-[7.5px] text-white/40">{getOdysseusSourceAssetSummary()}</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/35">Execution Boundary</div>
                <div className="mt-1 text-[10px] font-bold text-amber-200">Provenance only</div>
                <div className="mt-0.5 text-[7.5px] leading-relaxed text-white/40">
                  {ODYSSEUS_ASSET_AUDIT.executionBoundary}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-wider text-white/35">
                <span>Feature Integration Map</span>
                <span>{ODYSSEUS_FEATURE_MAP.length} source groups</span>
              </div>
              {ODYSSEUS_FEATURE_MAP.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/5 bg-black/20 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-bold text-white/85">{item.label}</div>
                      <div className="mt-0.5 text-[8px] text-white/40">{item.silverWolfSurface}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded border px-1.5 py-0.5 text-[7.5px] font-bold uppercase ${
                        item.integrationState === 'Bridge-backed'
                          ? 'border-green-500/25 bg-green-500/10 text-green-300'
                          : item.integrationState === 'Asset-copied'
                            ? 'border-yellow-500/25 bg-yellow-500/10 text-yellow-300'
                            : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300'
                      }`}
                    >
                      {item.integrationState}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[7.5px] font-bold uppercase">
                    <span className="rounded border border-white/5 bg-black/25 px-1.5 py-1 text-white/45">
                      UI: {item.integrationState === 'Not integrated' ? 'Unavailable' : 'Exposed'}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-1 ${
                        item.integrationState === 'Bridge-backed' && isOnline
                          ? 'border-green-500/20 bg-green-500/10 text-green-300'
                          : item.integrationState === 'Asset-copied'
                            ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300'
                            : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
                      }`}
                    >
                      State:{' '}
                      {item.integrationState === 'Bridge-backed'
                        ? isOnline
                          ? 'Live bridge'
                          : 'Bridge offline'
                        : item.integrationState === 'Asset-copied'
                          ? 'Static fallback'
                          : 'Unverified'}
                    </span>
                  </div>

                  <div className="rounded border border-white/5 bg-black/25 p-2 text-[8px] leading-relaxed text-white/55">
                    <span className="font-bold text-white/70">Current scope: </span>
                    {item.currentScope}
                  </div>

                  <div className="space-y-1">
                    <div className="text-[7.5px] font-bold uppercase tracking-wider text-white/30">Source Modules</div>
                    <div className="flex flex-wrap gap-1">
                      {item.sourceModules.map((source) => (
                        <span key={source} className="rounded bg-white/5 px-1.5 py-0.5 text-[7.5px] text-white/50">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded border border-primary/10 bg-primary/5 p-2 text-[8px] leading-relaxed text-white/45">
                    <span className="font-bold text-primary">Boundary: </span>
                    {item.securityBoundary}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-white/35">Copied Asset Ledger</div>
              {ODYSSEUS_ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-white/5 bg-black/20 p-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[9px] font-bold text-white/80">{asset.label}</div>
                    <div className="mt-0.5 break-all text-[7.5px] text-white/35">{asset.sourcePath}</div>
                    <div className="mt-1 text-[7.5px] leading-relaxed text-white/45">{asset.intendedUse}</div>
                  </div>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/80"
                    aria-label={`Open ${asset.label}`}
                    title={`Open ${asset.label}`}
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-wider text-white/35">
                <span>Full Source Mirror Ledger</span>
                <span>{ODYSSEUS_SOURCE_DOC_ASSETS.length} files</span>
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {ODYSSEUS_SOURCE_DOC_ASSETS.map((asset) => (
                  <div
                    key={asset.path}
                    className="flex items-center justify-between gap-2 rounded border border-white/5 bg-black/20 px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[8px] font-bold text-white/70">{asset.path}</div>
                      <div className="mt-0.5 break-all text-[7px] text-white/35">{asset.sourcePath}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[7px] font-bold uppercase ${
                          asset.kind === 'motion-demo'
                            ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                            : asset.kind === 'a11y-screenshot'
                              ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300'
                              : 'border-white/10 bg-white/5 text-white/50'
                        }`}
                      >
                        {asset.kind}
                      </span>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/80"
                        aria-label={`Open copied source asset ${asset.path}`}
                        title={`Open copied source asset ${asset.path}`}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
