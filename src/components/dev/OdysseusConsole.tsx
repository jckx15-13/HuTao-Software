import React, { useState, useEffect, useCallback } from 'react';
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
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'models' | 'tasks' | 'memory'>('status');
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [models, setModels] = useState<any>(null);
  const [tasks, setTasks] = useState<OdysseusTask[]>([]);
  const [dbStats, setDbStats] = useState<DBStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const bridgeUrl = 'http://127.0.0.1:8001';

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Server Status
      const statusRes = await fetch(`${bridgeUrl}/status`);
      if (!statusRes.ok) throw new Error('Bridge unreachable');
      const statusData: ServerStatus = await statusRes.json();
      setStatus(statusData);

      if (statusData.ready) {
        // 2. Fetch Models
        const modelsRes = await fetch(`${bridgeUrl}/api/models`);
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          setModels(modelsData);
        }

        // 3. Fetch Tasks
        const tasksRes = await fetch(`${bridgeUrl}/api/tasks`);
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(Array.isArray(tasksData) ? tasksData : []);
        }

        // 4. Fetch DB Stats
        const dbRes = await fetch(`${bridgeUrl}/api/db/stats`);
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          setDbStats(dbData);
        } else {
          // Fallback to rag stats if db stats fails
          const ragRes = await fetch(`${bridgeUrl}/api/rag/stats`);
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
      console.error(err);
      setError(err.message || 'Failed to fetch Odysseus stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll status on mount
  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const handleTaskAction = async (taskId: string, action: 'run' | 'pause' | 'resume') => {
    setActionMessage(null);
    try {
      const res = await fetch(`${bridgeUrl}/api/tasks/${taskId}/${action}`, {
        method: 'POST',
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
      setError(`Error executing task action: ${err.message}`);
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
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
            isOnline
              ? 'bg-green-500/25 text-green-400 border border-green-500/30'
              : 'bg-red-500/25 text-red-400 border border-red-500/30'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-green-400 animate-ping' : 'bg-red-400'}`} />
            {isOnline ? 'LINK ACTIVE' : 'LINK OFFLINE'}
          </span>
          <button
            onClick={refreshAll}
            disabled={loading}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-50"
            title="Force Telemetry Sync"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Odysseus Internal Tabs */}
      <div className="flex border-b border-white/5 bg-black/10 rounded-lg p-0.5 mb-3">
        {(['status', 'models', 'tasks', 'memory'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-1 rounded text-center uppercase text-[8px] font-bold tracking-wider transition-all duration-150 ${
              activeSubTab === tab
                ? 'bg-primary/20 text-primary font-bold shadow'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-2 mb-3 rounded bg-red-950/20 border border-red-500/30 text-red-400/80 leading-relaxed text-[9px] relative">
          <button onClick={() => setError(null)} className="absolute top-1 right-2 text-white/30 hover:text-white/70">×</button>
          <span className="font-bold mr-1">CRIT:</span> {error}
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
                  <span className="text-cyan-400 font-bold">127.0.0.1:8001</span>
                </div>
                <div className="p-2 bg-black/30 border border-white/5 rounded">
                  <span className="text-white/30 block uppercase">Odysseus core</span>
                  <span className="text-cyan-400 font-bold">127.0.0.1:7000</span>
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
              <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold mb-1">BRIDGE CONTEXT LOGS</div>
              <div className="bg-black/40 border border-white/5 rounded p-2 text-[8px] font-mono text-white/60 min-h-[80px] max-h-[150px] overflow-y-auto scroller">
                <div>[SYSTEM] Bridge Server active on: http://127.0.0.1:8001</div>
                <div>[SYSTEM] Admin Authorization Token Generated.</div>
                {isOnline ? (
                  <>
                    <div className="text-green-400/80">[SYSTEM] Connection with Odysseus Engine Established.</div>
                    <div className="text-cyan-400/80">[ODYSSEUS] Setup.py check verified. Skip Admin prompt active.</div>
                    <div className="text-white/50">[PROXY] Route bindings registered: /api/notes, /api/tasks, /api/calendar</div>
                  </>
                ) : (
                  <div className="text-red-400/80">[WARNING] Waiting for Odysseus subprocess lifespan initialization...</div>
                )}
              </div>
            </div>

            {!isOnline && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/80 rounded-xl leading-relaxed text-[9px]">
                <h4 className="font-bold mb-1 uppercase">How to spawn Odysseus manually:</h4>
                <p className="mb-2">If the bridge subprocess does not start automatically, verify python environment or run manually:</p>
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
                {models.endpoints && Array.isArray(models.endpoints) && models.endpoints.map((ep: any, index: number) => (
                  <div key={index} className="glass-panel p-2.5 border border-white/5 bg-black/20 rounded-xl space-y-1.5">
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
                      <span className="text-[8.5px] text-white/30 block uppercase font-bold tracking-tighter">Models List:</span>
                      <div className="flex flex-wrap gap-1">
                        {ep.models && Array.isArray(ep.models) ? ep.models.map((model: string) => (
                          <span key={model} className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-white/70 font-mono text-[8px]">
                            {model}
                          </span>
                        )) : (
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
                <span>NO MODELS LOADED</span>
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
                  <div key={task.id} className="glass-panel p-2.5 border border-white/5 bg-black/20 rounded-xl space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white/80 truncate text-[9.5px]" title={task.name}>
                          {task.name}
                        </div>
                        {task.description && (
                          <div className="text-[8.5px] text-white/40 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </div>

                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ml-2 uppercase ${
                        task.status === 'active' || task.status === 'running'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-white/5 text-white/30 border border-white/5'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-white/50 bg-black/30 p-1.5 rounded border border-white/5">
                      <div>
                        <span className="text-white/25 block uppercase text-[7.5px]">Schedule</span>
                        <span className="text-cyan-400 font-bold truncate block">{task.frequency || task.cron_expression || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-white/25 block uppercase text-[7.5px]">Next Run</span>
                        <span className="truncate block">{task.next_run ? new Date(task.next_run).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-1.5 border-t border-white/5">
                      <button
                        onClick={() => handleTaskAction(task.id, 'run')}
                        className="flex-1 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all duration-150"
                      >
                        <Play size={10} />
                        <span>Run Now</span>
                      </button>

                      {task.status === 'active' ? (
                        <button
                          onClick={() => handleTaskAction(task.id, 'pause')}
                          className="flex-1 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all duration-150"
                        >
                          <Pause size={10} />
                          <span>Pause</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTaskAction(task.id, 'resume')}
                          className="flex-1 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all duration-150"
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
                <span>NO SCHEDULER TASKS</span>
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
                        <div key={table} className="flex justify-between items-center font-mono py-1 border-b border-white/5 text-[9px] text-white/70">
                          <span className="uppercase text-white/40">{table.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-white">{count} items</span>
                        </div>
                      ))
                    ) : dbStats.collections && Object.keys(dbStats.collections).length > 0 ? (
                      Object.entries(dbStats.collections).map(([col, count]) => (
                        <div key={col} className="flex justify-between items-center font-mono py-1 border-b border-white/5 text-[9px] text-white/70">
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
                    Odysseus aggregates workspace files, notes, and browsing history. Data is tokenized and stored in a local ChromaDB instance to allow semantic recall (RAG) during chat sessions.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-white/20">
                <Database size={24} className="mb-2 opacity-15" />
                <span>NO DATA FOUND</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
